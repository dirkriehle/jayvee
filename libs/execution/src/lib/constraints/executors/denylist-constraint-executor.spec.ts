// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockDefinition,
  InternalValueRepresentation,
  TypedConstraintDefinition,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  TestLangExtension,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { getTestExecutionContext } from '../../../../test/utils';

import { DenylistConstraintExecutor } from './denylist-constraint-executor';

describe('Validation of DenylistConstraintExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../../test/assets/',
  );

  async function parseAndValidateConstraint(
    input: string,
    value: InternalValueRepresentation,
  ): Promise<boolean> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const usageBlock = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@2',
    ) as BlockDefinition;
    const constraint = locator.getAstNode<TypedConstraintDefinition>(
      document.parseResult.value,
      'constraints@0',
    ) as TypedConstraintDefinition;

    return new DenylistConstraintExecutor().isValid(
      value,
      // Execution context with initial stack containing usage block of constraint and constraint itself
      getTestExecutionContext(locator, document, [usageBlock, constraint]),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'denylist-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 's');

    expect(valid).toBe(true);
  });

  it('should diagnose error on invalid value', async () => {
    const text = readJvTestAsset(
      'denylist-constraint-executor/valid-constraint.jv',
    );

    const valid = await parseAndValidateConstraint(text, 'ns');

    expect(valid).toBe(false);
  });
});
