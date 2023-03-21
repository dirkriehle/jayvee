/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { ValidationAcceptor, ValidationChecks } from 'langium';

import {
  JayveeAstType,
  PropertyValueType,
  ValuetypeDefinition,
  inferTypesFromValue,
  isConstraintReferenceLiteral,
} from '../../ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { JayveeValidator } from '../jayvee-validator';

export class ValuetypeValidator implements JayveeValidator {
  get checks(): ValidationChecks<JayveeAstType> {
    return {
      ValuetypeDefinition: [
        this.checkConstraintsCollectionValues,
        this.checkConstraintsMatchPrimitiveValuetype,
      ],
    };
  }

  checkConstraintsCollectionValues(
    this: void,
    valuetype: ValuetypeDefinition,
    accept: ValidationAcceptor,
  ): void {
    const constraints = valuetype.constraints;
    constraints.values.forEach((collectionValue) => {
      const types = inferTypesFromValue(collectionValue);
      if (!types.includes(PropertyValueType.CONSTRAINT)) {
        accept('error', 'Only constraints are allowed in this collection', {
          node: collectionValue,
        });
      }
    });
  }

  checkConstraintsMatchPrimitiveValuetype(
    this: void,
    valuetype: ValuetypeDefinition,
    accept: ValidationAcceptor,
  ): void {
    if (valuetype.type === undefined) {
      return;
    }

    const constraintReferences = valuetype?.constraints?.values.filter(
      isConstraintReferenceLiteral,
    );
    for (const constraintReference of constraintReferences) {
      const constraint = constraintReference?.value.ref;
      const constraintType = constraint?.type;

      if (constraintType === undefined) {
        continue;
      }

      const metaInf = getMetaInformation(constraintType);
      if (metaInf === undefined) {
        continue;
      }

      if (!metaInf.compatiblePrimitiveValuetypes.includes(valuetype.type)) {
        accept(
          'error',
          `Only constraints for type "${valuetype.type}" are allowed in this collection`,
          {
            node: constraintReference,
          },
        );
      }
    }
  }
}
