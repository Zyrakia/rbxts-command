import { Arrays } from '@rbxts/zycore';
import { Option, MapOptions } from '@rbxts/zycore';
import { ArgumentValueParser } from './ArgumentParser';

/** Represents a step in the description parsing process. */
interface ParseStep {
	parsers: ArgumentValueParser<defined>[];
	required: boolean;
}

/** Represents a parser or an array of parsers. */
type Parsers = ArgumentValueParser<defined>[] | ArgumentValueParser<defined>;

/** Represents the value that the specified parsers can return. */
type Value<T extends Parsers> = T extends ArgumentValueParser<infer V>
	? V
	: T extends ArgumentValueParser<defined>[]
	? { [K in keyof T]: T[K] extends ArgumentValueParser<infer V> ? V : never }[number]
	: never;

/**
 * Utility class for describing the parsing process
 * of a set of arguments so that it stays readable
 * and easy to understand.
 */
export class ArgumentDescriptor<T extends unknown[] = []> {
	private steps: ParseStep[] = [];

	/**
	 * Constructs a new ArgumentDescriptor with the specified arguments.
	 * This is a utility class to descript the parsing process for a set of
	 * arguments in order to make it more declarative and readable.
	 *
	 * When a parser parses an argument, it will fill it's own `Option`
	 * with the parsed value. If the parser returns a value that is
	 * not undefined, it will move on to the next parser, and the next argument.
	 * If the parser returns undefined, it will move on to the next parser,
	 * but not to the next argument.
	 *
	 * If a parser returns undefined, and it is required, the parsing process
	 * will be cancelled and any `Option`'s that have not been filled will
	 * be returned empty.
	 *
	 * Example:
	 * ```ts
	 * const [target, color, size] =
	 * 		new ArgumentDescriptor(["xzyrakia", "red", "large"])
	 * 			.then(new TargetParser(), true) // target is required, if not found, the parsing process is cancelled
	 * 			.then(new ColorParser()) // color is optional, if not found the next parser tries to parse the same argument
	 * 			.then(new SizeParser()) // if color is not found, parses from the second argument instead of the third
	 * ```
	 *
	 */
	public constructor(private defaultArgs: string[] = []) {}

	/**
	 * Adds a parse step to the description.
	 *
	 * @param parsers The parsers to use on this step.
	 * @param required Whether or not to cancel the parsing process if no match is found during this step.
	 */
	public then<P extends Parsers>(parsers: P, required = false) {
		this.steps.push({ parsers: this.resolveParsers(parsers), required });
		return this as unknown as ArgumentDescriptor<[...T, Value<P>]>;
	}

	/**
	 * Adds a parse step to the description only if the specified condition is met.
	 * If required is true, but the condition is not met, the parsing process is still
	 * cancelled when this parsing step is reached during compilation.
	 *
	 * @param condition The condition to check.
	 * @param parsers The parsers to use on this step.
	 * @param required Whether or not to cancel the parsing process if no match is found during this step.
	 */
	public thenIf<P extends Parsers>(condition: boolean, parsers: P, required = false) {
		if (condition) this.steps.push({ parsers: this.resolveParsers(parsers), required });
		else this.steps.push({ parsers: [], required: false });
		return this as unknown as ArgumentDescriptor<[...T, Value<P>]>;
	}

	/**
	 * Resolves a single parser or an array of parsers
	 * into an array of parsers.
	 *
	 * @param parsers The parser or array of parsers to resolve.
	 * @returns The resolved parsers.
	 */
	private resolveParsers(parsers: Parsers) {
		return Arrays.is(parsers) ? parsers : [parsers];
	}

	/**
	 * Parses the arguments using the description built
	 * up to this point.
	 *
	 * @param args The arguments to parse, defaults to the arguments passed at construction.
	 * @returns An {@link Option} tuple containing the parsed values.
	 */
	public compile(args: string[] = this.defaultArgs) {
		const results = Option.nones(this.steps.size()) as MapOptions<T>;
		return this.parseFrom(args, 0, 0, results);
	}

	/**
	 * Recursively parses the arguments using the descriptor built up to this point.
	 *
	 * @param stepIndex The parse step currently parsing.
	 * @param argumentIndex The argument currently being parsed.
	 * @param options The options to fill the parsed values into.
	 * @returns The parsed values.
	 */
	private parseFrom<T extends Option<any>[]>(
		args: string[],
		stepIndex: number,
		argumentIndex: number,
		options: T,
	): T {
		const value = args[argumentIndex];
		const step = this.steps[stepIndex];
		const opt = options[stepIndex];
		if (value === undefined || !step || !opt) return options;

		const { parsers, required } = step;
		for (const parser of parsers) {
			opt.set(parser.parse(value) as T);
			if (opt.isSome()) return this.parseFrom(args, stepIndex + 1, argumentIndex + 1, options);
		}

		if (required) return options;
		else return this.parseFrom(args, stepIndex + 1, argumentIndex, options);
	}
}
