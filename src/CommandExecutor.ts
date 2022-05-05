import { ArgumentParser } from './args/ArgumentParser';

/** Describes the arguments passed to a command executor. */
export type ExecutorArgs = [sender: Player, args: ArgumentParser, usedAlias: string];

/** Describes a class that can execute a command. */
export interface CommandExecutor {
	execute(...args: ExecutorArgs): unknown;
}

/** Describes a function that can execute a command. */
export type AnonCommandExecutor = (...args: ExecutorArgs) => unknown;

/** Describes anything that can execute a command. */
export type CExecutor = CommandExecutor | AnonCommandExecutor;
