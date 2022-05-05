import { Objects } from '@rbxts/zycore';
import { ArgumentParser } from './args/ArgumentParser';
import { CExecutor, ExecutorArgs } from './CommandExecutor';
import { ExecutionResult } from './ExecutionResult';

/** Represents the bare minimum of a command. */
export interface CommandConfig {
	identifier: string;
	aliases?: string[];
}

/** Represents a command that can be executed. */
export type CommandDescriptor<C extends CommandConfig> = {
	config: C;
	executor: CExecutor;
};

/**
 * Utility class for handling execution and registration of commands.
 */
export class Commander<C extends CommandConfig> {
	/** Maps commands by their identifier and aliases. */
	private commands = new Map<string, CommandDescriptor<C>>();

	/** An optional default to fill in new command configs. */
	private defaulter?: (obj: Partial<C>) => C;

	public constructor(
		private readonly commandHook?: (
			command: CommandDescriptor<C>,
			commandResult: unknown,
			executorArgs: ExecutorArgs,
		) => void,
	) {}

	/**
	 * Attempts to find the command descriptor for the identifier of
	 * the given command config. If found, the command descriptor is
	 * executed.
	 *
	 * @param sender The sender of the command.
	 * @param config The command config.
	 * @param args The arguments of the command.
	 * @returns The result of the command execution.
	 */
	public executeConfig(sender: Player, config: C, args: string[]) {
		const descriptor = this.commands.get(config.identifier);
		if (!descriptor) return ExecutionResult.NOT_FOUND;

		return this.execute(sender, descriptor, args, config.identifier);
	}

	/**
	 * Directly executes the given command descriptor, whether this commander
	 * has knowledge of it or not.
	 *
	 * @param sender The sender of the command.
	 * @param descriptor The command descriptor.
	 * @param args The arguments of the command.
	 * @returns The result of the command execution, and the command promise.
	 */
	public executeDescriptor(sender: Player, descriptor: CommandDescriptor<C>, args: string[]) {
		return this.execute(sender, descriptor, args, descriptor.config.identifier);
	}

	/**
	 * Attempts to find a command descriptor for the given command name, which
	 * is either the identifier or an alias of the command. If found, the
	 * command descriptor is executed.
	 *
	 * @param sender The sender of the command.
	 * @param command The command name.
	 * @param args The arguments of the command.
	 * @returns The result of the command execution, and the command promise.
	 */
	public executeName(sender: Player, command: string, args: string[]) {
		const descriptor = this.commands.get(command);
		if (!descriptor) return ExecutionResult.NOT_FOUND;

		return this.execute(sender, descriptor, args, command);
	}

	/**
	 * Returns any mapped descriptor that matches the given
	 * identifier or alias.
	 *
	 * @param name The identifier or alias.
	 * @returns The command descriptor, or undefined if none was found.
	 */
	public getDescriptor(name: string) {
		return this.commands.get(name);
	}

	/**
	 * Registers the given command config with this commander.
	 * The config is turned into a command descriptor with the
	 * given executor, and the identifier and aliases of the config
	 * are used to map the descriptor.
	 *
	 * This overrides any previous commands with the same identifier
	 * or aliases.
	 *
	 * @param config The command config.
	 * @param executor The command executor.
	 */
	public registerCommand(config: C, executor: CExecutor) {
		const descriptor = { config: this.defaulter ? this.defaulter(config) : config, executor };

		this.commands.set(config.identifier, descriptor);
		if (config.aliases) config.aliases.forEach((a) => this.commands.set(a, descriptor));

		return this;
	}

	/**
	 * Finds the given command descriptor for the identifier
	 * of the given command config. If found, the command descriptor is
	 * deleted, and command descriptors at any of the aliases of the
	 * command config are also deleted.
	 *
	 * @param config The command config.
	 * @returns Whether the command descriptor was found and deleted.
	 */
	public deregisterCommand(config: C) {
		const descriptor = this.commands.get(config.identifier);
		if (!descriptor) return false;

		this.commands.delete(config.identifier);
		if (config.aliases) config.aliases.forEach((a) => this.commands.delete(a));

		return true;
	}

	public setDefaults(config: Required<C>) {
		this.defaulter = Objects.defaulter(config);
		return this;
	}

	/**
	 * Executes the given command descriptor by validating the sender's eligibility
	 * and running the executor.
	 *
	 * @param sender The sender of the command.
	 * @param command The command descriptor.
	 * @param args The arguments of the command.
	 * @param usedAlias The alias that was used to execute the command.
	 * @returns The result of the command execution.
	 */
	private execute(sender: Player, command: CommandDescriptor<C>, args: string[], usedAlias: string) {
		if (!this.canExecute(sender, command)) return ExecutionResult.NO_PERMISSION;

		const executor = command.executor;
		const argsParser = new ArgumentParser(args);

		const executorArgs: ExecutorArgs = [sender, argsParser, usedAlias];
		this.runExecutor(executor, executorArgs).then((res) => {
			if (this.commandHook) this.commandHook(command, res, executorArgs);
		});

		return ExecutionResult.EXECUTED;
	}

	/**
	 * Asynchronously runs the given command executor.
	 *
	 * @param executor The command executor.
	 * @param args The arguments to pass to the executor.
	 * @returns Whether the executor returned anything other than false.
	 */
	private async runExecutor(executor: CExecutor, args: ExecutorArgs) {
		let success = false;

		try {
			const result = typeIs(executor, 'function') ? executor(...args) : executor.execute(...args);
			success = result !== false;
		} finally {
		}

		return success;
	}

	/**
	 * Whether the given sender can execute the given command descriptor.
	 * This can be overridden in subclasses to provide custom permissions.
	 *
	 * @param sender The sender of the command.
	 * @param command The command descriptor.
	 * @returns Whether the sender can execute the command, by default true.
	 */
	public canExecute(sender: Player, command: CommandDescriptor<C>) {
		return true;
	}
}
