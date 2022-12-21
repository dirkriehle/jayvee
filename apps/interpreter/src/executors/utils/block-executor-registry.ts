import { strict as assert } from 'assert';

import { BlockExecutor } from '@jayvee/execution';
import { BlockExecutorType } from '@jayvee/extensions/std';
import { Block } from '@jayvee/language-server';

const registeredBlockExecutors = new Map<string, BlockExecutorType>();

export function registerBlockExecutor(blockExecutor: BlockExecutorType) {
  const blockType = new blockExecutor().blockType;
  assert(
    !registeredBlockExecutors.has(blockType),
    `Multiple executors were registered for block type ${blockType}`,
  );

  registeredBlockExecutors.set(blockType, blockExecutor);
}

export function createBlockExecutor(
  block: Block,
  runtimeParameters: Map<string, string | number | boolean>,
): BlockExecutor {
  const blockExecutor = registeredBlockExecutors.get(block.type);
  assert(
    blockExecutor !== undefined,
    `No executor was registered for block type ${block.type}`,
  );

  const blockExecutorInstance = new blockExecutor();
  blockExecutorInstance.block = block;
  blockExecutorInstance.runtimeParameters = runtimeParameters;

  return blockExecutorInstance;
}
