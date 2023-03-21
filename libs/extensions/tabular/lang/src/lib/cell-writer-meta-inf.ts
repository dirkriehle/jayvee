import {
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  PropertyValueType,
  isCellRangeLiteral,
  isCellWrapper,
} from '@jvalue/language-server';

export class CellWriterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'CellWriter',
      {
        write: {
          type: PropertyValueType.TEXT,
          docs: {
            description: 'The value to write.',
            examples: [
              {
                code: 'write: "Name"',
                description: 'Write the value "Name" into the cell',
              },
            ],
          },
        },
        at: {
          type: PropertyValueType.CELL_RANGE,
          validation: (property, accept) => {
            const propertyValue = property.value;
            if (!isCellRangeLiteral(propertyValue)) {
              return;
            }

            if (!CellRangeWrapper.canBeWrapped(propertyValue)) {
              return;
            }
            const semanticCellRange = new CellRangeWrapper(propertyValue);
            if (!isCellWrapper(semanticCellRange)) {
              accept('error', 'A single cell needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          },
          docs: {
            description: 'The cell to write into.',
            examples: [{ code: 'at: A1', description: 'Write into cell A1' }],
            validation: 'You need to specify exactly one cell.',
          },
        },
      },
      IOType.SHEET,
      IOType.SHEET,
    );
    this.docs.description = 'Writes a textual value into a cell of a `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Write the value "Name" into cell `A1`.',
      },
    ];
  }
}

const blockExample = `block NameHeaderWriter oftype CellWriter {
  at: cell A1;
  write: "Name";
}`;
