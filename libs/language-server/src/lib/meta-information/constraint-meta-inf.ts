import { PrimitiveValuetype } from '../ast/generated/ast';

// eslint-disable-next-line import/no-cycle
import { AttributeSpecification, MetaInformation } from './meta-inf';

export abstract class ConstraintMetaInformation extends MetaInformation {
  protected constructor(
    constraintType: string,
    attributes: Record<string, AttributeSpecification>,
    public readonly compatiblePrimitiveValuetypes: PrimitiveValuetype[],
  ) {
    super(constraintType, attributes);
  }
}
