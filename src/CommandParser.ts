import { Strings } from '@rbxts/zycore';

/**
 * Utility class for parsing a string into
 * a command name and arguments.
 */
export class CommandParser {
	/**
	 * Constructs a new CommandParser with the given
	 * command prefix.
	 *
	 * @param prefix The command prefix.
	 */
	public constructor(private prefix: string) {}

	/**
	 * Disects the given string into a command name and
	 * arguments.
	 *
	 * @param input The input string.
	 * @return The command name and arguments, or undefined.
	 */
	public disect(input: string) {
		if (!input) return;

		const trimmed = Strings.trim(input);
		if (!trimmed || !Strings.startsWith(trimmed, this.prefix)) return;

		const deprefixed = Strings.slice(trimmed, this.prefix.size() + 1);
		if (!deprefixed) return;

		const split = deprefixed.split(' ');
		const name = split.shift();
		const args = split;

		if (name) return { name, args, input };
	}

	/**
	 * Sets the command prefix.
	 */
	public setPrefix(prefix: string) {
		this.prefix = prefix;
	}

	/**
	 * Returns the command prefix.
	 */
	public getPrefix() {
		return this.prefix;
	}
}
