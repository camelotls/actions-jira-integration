from gitlint.rules import CommitRule, RuleViolation
from gitlint.options import IntOption
import re

class SignedOffBy(CommitRule):
    """ This rule will enforce that each commit contains a "Signed-off-by" line with a name and email address.
    """
    id = "SIGNOFF"
    name = "body-requires-signed-off-by"

    signOffRegex = re.compile('^(DCO 1.1 )?Signed-off-by: .* <[^@ ]+@[^@ ]+\.[^@ ]+>')

    def validate(self, commit):
        for line in commit.message.body:
            if self.signOffRegex.match(line):
                return

        return [RuleViolation(self.id, "Body does not contain a valid 'Signed-off-by' line", line_nr=1)]


class GithubIssue(CommitRule):
    """ This rule will enforce that each commit is associated with a Github issue that explains what the commit is for.
    """
    id = "COMMIT"
    name = "commit-require-github-issue"

    githubIssueRegex = re.compile('(Resolves|Closes|Contributes to|Reverts):? [a-z\-/]*#[0-9]+')

    def validate(self, commit):
        for line in commit.message.body:
            if self.githubIssueRegex.match(line):
                return

        return [RuleViolation(self.id, "Body does not contain a github issue reference", line_nr=1)]
        