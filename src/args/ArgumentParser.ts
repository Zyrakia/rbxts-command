import { Option } from '@rbxts/zycore';
import { ArgumentDescriptor } from './ArgumentDescriptor';

/** Represents a parser that can parse `T` out of a string value. */
export interface ArgumentValueParser<T extends defined> {
	parse(value: string): (T | undefined) | void;
}

/** Represents an array of parsers. */
type Parsers = ArgumentValueParser<defined>[];

/** Represents the result provided by the parsers. */
type SingleParsersResult<T extends Parsers> =
	| (T[number] extends ArgumentValueParser<infer U> ? U : never)
	| undefined;

/** Represents all possible results provided by the specified parsers. */
type ParsersResult<T extends Parsers> = {
	[K in keyof T]: T[K] extends ArgumentValueParser<infer U> ? Option<U> : never;
};

/**
 * Utility class for parsing an array of string arguments with
 * different utility methods.
 */
export class ArgumentParser {
	/** The arguments being parsed. */
	private args: string[] = [];

	/**
	 * Constructs a new ArgumentParser.
	 * This spreads the specified arguments
	 * into a new array, the input arguments
	 * are not modified.
	 *
	 * @param args The arguments to parse.
	 */
	public constructor(args: string[]) {
		if (!args || args.isEmpty()) return;
		this.args = [...args];
	}

	/**
	 * Parses the value at the specified index with the
	 * specified parser(s). The first result that
	 * is not undefined is returned.
	 *
	 * @param index The index to parse.
	 * @param parsers The parsers to use.
	 * @return The parsed value.
	 */
	public get<T extends Parsers>(index: number, ...parsers: T) {
		return this.parse(this.args[index], ...parsers);
	}

	/**
	 * Parses the value at the specified index with
	 * the specified parser(s). Instead of {@link get}, this
	 * returns a tuple of all possible results in `Option`'s,
	 * the parsing still cuts off at the first result that is not
	 * undefined.
	 *
	 * @param index The index to parse.
	 * @param parsers The parsers to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	public getAny<T extends Parsers>(index: number, ...parsers: T) {
		return this.parseAny(this.args[index], ...parsers);
	}

	/**
	 * Shifts the first argument off the array and attempts
	 * to parse it with the specified parser(s).
	 *
	 * @param parsers The parsers to use.
	 * @return The parsed value.
	 */
	public shift<T extends Parsers>(...parsers: T) {
		return this.parse(this.args.shift(), ...parsers);
	}

	/**
	 * Shifts the first argument off the array and attempts
	 * to parse it with the specified parser(s). Instead of {@link shift},
	 * this returns a tuple of all possible results in `Option`'s,
	 * the parsing still cuts off at the first result that is not
	 * undefined.
	 *
	 * @param parsers The parsers to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	public shiftAny<T extends Parsers>(...parsers: T) {
		return this.parseAny(this.args.shift(), ...parsers);
	}

	/**
	 * Parses the first argument of the array with the
	 * specified parser(s), and if a result is found,
	 * removes it from the array.
	 *
	 * @param parsers The parsers to use.
	 * @return The parsed value.
	 */
	public shiftIf<T extends Parsers>(...parsers: T) {
		const result = this.parse(this.args[0], ...parsers);
		if (result !== undefined) this.args.remove(0);

		return result;
	}

	/**
	 * Parses the first argument of the array with the
	 * specified parser(s), and if a result is found,
	 * removes it from the array. Instead of {@link shiftIf},
	 * this returns a tuple of all possible results in `Option`'s,
	 * the parsing still cuts off at the first result that is not
	 * undefined.
	 *
	 * @param parsers The parsers to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	public shiftIfAny<T extends Parsers>(...parsers: T) {
		const result = this.parseAny(this.args[0], ...parsers);
		if (result.some((v) => v.isSome())) this.args.remove(0);

		return result;
	}

	/**
	 * Pops the last argument off the array and attempts
	 * to parse it with the specified parser(s).
	 *
	 * @param parsers The parsers to use.
	 * @return The parsed value.
	 */
	public pop<T extends Parsers>(...parsers: T) {
		return this.parse(this.args.pop(), ...parsers);
	}

	/**
	 * Parses the last argument of the array with the
	 * specified parser(s), and if a result is found,
	 * removes it from the array. Instead of {@link pop},
	 * this returns a tuple of all possible results in `Option`'s,
	 * the parsing still cuts off at the first result that is not
	 * undefined.
	 *
	 * @param parsers The parsers to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	public popAny<T extends Parsers>(...parsers: T) {
		return this.parseAny(this.args.pop(), ...parsers);
	}

	/**
	 * Joins all the arguments into a single string and attempts to parse
	 * it with the specified parser(s).
	 *
	 * @param parsers The parsers to use.
	 * @param separator The separator to use.
	 * @return The parsed value.
	 */
	public join<T extends defined>(parsers: ArgumentValueParser<T>, separator = '') {
		return this.parse(this.args.join(separator), parsers);
	}

	/**
	 * Joins all the arguments into a single string and attempts to parse
	 * it with the specified parser(s). Instead of {@link join}, this
	 * returns a tuple of all possible results in `Option`'s,
	 * the parsing still cuts off at the first result that is not
	 * undefined.
	 *
	 * @param parsers The parsers to use.
	 * @param separator The separator to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	public joinAny<T extends Parsers>(parsers: T, seperator = '') {
		return this.parseAny(this.args.join(seperator), ...parsers);
	}

	/**
	 * Creates a new {@link ArgumentDescriptor} with the arguments within this
	 * ArgumentParser.
	 */
	public describe() {
		return new ArgumentDescriptor(this.args);
	}

	/**
	 * Parses the specified value with the specified parsers.
	 *
	 * @param value The value to parse.
	 * @param parsers The parsers to use.
	 * @return The first parsed value.
	 */
	private parse<T extends Parsers>(value: string | undefined, ...parsers: T) {
		if (value === undefined) return;

		for (const parser of parsers) {
			const result = parser.parse(value);
			if (result !== undefined) return result as SingleParsersResult<T>;
		}
	}

	/**
	 * Parses the specified value with the specified parsers.
	 *
	 * @param value The value to parse.
	 * @param parsers The parsers to use.
	 * @return The possible results as a tuple of `Options`'s.
	 */
	private parseAny<T extends Parsers>(value: string | undefined, ...parsers: T) {
		const results = Option.nones(parsers.size()) as ParsersResult<T>;
		if (value === undefined) return results;

		for (let i = 0; i < parsers.size(); i++) {
			const parser = parsers[i];
			const option = results[i];

			const result = parser.parse(value);
			if (result !== undefined) option.set(result);

			if (option.isSome()) break;
		}

		return results;
	}

	/**
	 * Returns the size of the underlying argument array.
	 */
	public size() {
		return this.args.size();
	}

	/**
	 * Returns the underlying argument array.
	 */
	public getArgs() {
		return this.args;
	}

	/**
	 * Returns the underlying argument array as a string.
	 * Example: `["a","b","c"] -> { "a", "b", "c" }`
	 */
	public toString() {
		return `{ ${this.args.join(', ')} }`;
	}
}
