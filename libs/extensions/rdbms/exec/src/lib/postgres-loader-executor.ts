import * as R from '@jvalue/execution';
import {
  BlockExecutor,
  ExecutionContext,
  NONE,
  None,
  Table,
} from '@jvalue/execution';
import { IOType } from '@jvalue/language-server';
import { Client } from 'pg';

export class PostgresLoaderExecutor
  implements BlockExecutor<IOType.TABLE, IOType.NONE>
{
  public readonly blockType = 'PostgresLoader';
  public readonly inputType = IOType.TABLE;
  public readonly outputType = IOType.NONE;

  async execute(
    input: Table,
    context: ExecutionContext,
  ): Promise<R.Result<None>> {
    const host = context.getTextAttributeValue('host');
    const port = context.getNumericAttributeValue('port');
    const user = context.getTextAttributeValue('username');
    const password = context.getTextAttributeValue('password');
    const database = context.getTextAttributeValue('database');
    const table = context.getTextAttributeValue('table');

    const client = new Client({
      host,
      port,
      user,
      password,
      database,
    });

    try {
      context.logger.logDebug(`Connecting to database`);
      await client.connect();

      context.logger.logDebug(
        `Dropping previous table "${table}" if it exists`,
      );
      await client.query(Table.generateDropTableStatement(table));
      context.logger.logDebug(`Creating table "${table}"`);
      await client.query(input.generateCreateTableStatement(table));
      context.logger.logDebug(
        `Inserting ${input.getNumberOfRows()} row(s) into table "${table}"`,
      );
      await client.query(input.generateInsertValuesStatement(table));

      context.logger.logDebug(
        `The data was successfully loaded into the database`,
      );
      return R.ok(NONE);
    } catch (err: unknown) {
      return R.err({
        message: `Could not write to postgres database: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        diagnostic: { node: context.getCurrentNode(), property: 'name' },
      });
    } finally {
      await client.end();
    }
  }
}
