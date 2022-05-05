# Command

A simple command registration and execution management system including some utilities to parse arguments and disect command strings.
This library is meant to be used with player centric commands, every command must have a player sender, this may not be for you if that's
not what you want.

## Example

A simple example demonstrating argument parsing, command registration and command execution.

```ts
class TargetParser implements ArgumentValueParser<Player> {
	private players = game.GetService('Players');

	public parse(value: string) {
		// TODO you can implement more robust and advanced
		// player parsing, such as checking for a player's
		// name, their ID, whether the name includes the
		// value, etc...

		return this.players.GetPlayers().find((player) => {
			return player.Name.lower() === value.lower();
		});
	}
}

class NumberParser implements ArgumentValueParser<number> {
	public parse(value: string) {
		// TODO you can implement more robust and advanced
		// number parsing, such as a configuration to
		// enable clamping, rounding, etc...

		return tonumber(value);
	}
}

const commander = new Commander();

// Commands can be functions or classes, up to you and your coding style.
commander.registerCommand({ identifier: 'hurt' }, (sender, args) => {
	// Take a look at the doc comments of ArgumentParser and ArgumentDescriptor
	// to find more about how to declaratively parse arguments like this.
	const [target, damage] = args.describe().then(new TargetParser()).then(new NumberParser()).compile();

	const char = target.get(sender).Character;
	if (!char) return;

	const hum = char.FindFirstChildOfClass('Humanoid');
	if (!hum) return;

	hum.Health = hum.Health - damage.get(hum.Health);
});

commander.executeName(game.GetService('Players').LocalPlayer, 'hurt', ['xzyrakia', '5']);
```
