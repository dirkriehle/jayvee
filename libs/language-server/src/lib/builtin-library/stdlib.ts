// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType, PrimitiveValuetype, internalValueToString } from '../ast';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';
import {
  ConstraintMetaInformation,
  constraintMetaInfRegistry,
} from '../meta-information';

import { PartialStdLib } from './generated/partial-stdlib';

export function getBuiltinValuetypesLib() {
  const primitiveValuetypes = Object.values(PrimitiveValuetypes).map(
    parseBuiltinValuetypeToJayvee,
  );

  const collectionValuetype = `${parseAsComment('For internal use only.')}
builtin valuetype Collection<ElementType>;`;

  return {
    'builtin:///stdlib/builtin-valuetypes.jv': [
      ...primitiveValuetypes,
      collectionValuetype,
    ].join('\n\n'),
  };
}

export const IOtypesLib = {
  'builtin:///stdlib/iotypes.jv': Object.values(IOType)
    .map((iotype) => `builtin iotype ${iotype};`)
    .join('\n\n'),
};

// Is a method since metaInformationRegistry might not be initialized when this as variable.
export function getBuiltinConstrainttypesLib() {
  const builtins = constraintMetaInfRegistry.getAllEntries();
  return {
    'builtin:///stdlib/builtin-constrainttypes.jv': builtins
      .filter((entry) => entry.value instanceof ConstraintMetaInformation)
      .map((entry) => parseConstraintMetaInfToJayvee(entry.key, entry.value))
      .join('\n\n'),
  };
}

export function getStdLib() {
  return {
    ...PartialStdLib,
    ...getBuiltinValuetypesLib(),
    ...IOtypesLib,
    ...getBuiltinConstrainttypesLib(),
  };
}

function parseBuiltinValuetypeToJayvee(valuetype: PrimitiveValuetype): string {
  const lines: string[] = [];

  const userDoc = valuetype.getUserDoc();
  if (userDoc !== undefined) {
    lines.push(parseAsComment(userDoc));
  }
  if (!valuetype.isReferenceableByUser()) {
    lines.push(parseAsComment('For internal use only.'));
  }
  lines.push(`builtin valuetype ${valuetype.getName()};`);

  return lines.join('\n');
}

function parseConstraintMetaInfToJayvee(
  name: string,
  metaInf: ConstraintMetaInformation,
): string {
  const lines: string[] = [];
  if (metaInf.docs.description !== undefined) {
    lines.push(parseAsComment(metaInf.docs.description));
  }
  if (metaInf.docs.examples !== undefined) {
    metaInf.docs.examples.forEach((example, i) => {
      lines.push('//');
      lines.push(`// Example ${i + 1}: ${example.description}`);
      lines.push(parseAsComment(example.code));
    });
  }

  lines.push(`builtin constrainttype ${name} {`);
  lines.push(parseBuiltinConstrainttypeBody(metaInf));
  lines.push('}');

  return lines.join('\n');
}

function parseBuiltinConstrainttypeBody(
  metaInf: ConstraintMetaInformation,
): string {
  const bodyLines: string[] = [];

  Object.entries(metaInf.getPropertySpecifications()).forEach(
    ([propName, propSpecification]) => {
      const propDoc = propSpecification.docs?.description;
      if (propDoc !== undefined) {
        bodyLines.push(parseAsComment(propDoc, 1));
      }
      bodyLines.push(
        `\tproperty ${propName} oftype ${propSpecification.type.getName()} ${
          propSpecification.defaultValue !== undefined
            ? `: ${internalValueToString(propSpecification.defaultValue)}`
            : ''
        };`,
      );
    },
  );

  return bodyLines.join('\n');
}

function parseAsComment(text: string, indents = 0): string {
  return text
    .split('\n')
    .map((l) => `// ${l}`)
    .map((l) => '\t'.repeat(indents) + l)
    .join('\n');
}