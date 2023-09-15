# postman-newman-action

Run newman/postman collections via GitHub actions using newman 6.0.0 and newman run summary as action output for further notifications.

First of all, thanks a lot to the users [@anthonyvscode](https://github.com/anthonyvscode/newman-action) and [@matt-ball](https://github.com/matt-ball/newman-action) for creating their newman-actions, which I took as reference for this action.
What I try to accomplish with this new action is to have the best of both worlds (@anthonyvscode's + @matt-ball`s actions) + more up to date versions of dependencies.

- Making use of all available NewmanRunOptions as input
- Using node 20 instead of node 12
- Use a newer version of the newman library (6.0.0)
- Set the summary of the newman run as output, so that followup actions can use the summary, e.g., for more sophisticated notifications.

If I find time I'd also intend to include sending notifications about the run for popular messengers.

## Inputs

... to be done ...

## Outputs

... to be done ...

## Example Usage

... to be done ...
