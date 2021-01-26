import { promises as Fs } from 'fs';
import * as Url from 'url';
import Yargs from 'yargs';
import { parser, Changelog, Release } from 'keep-a-changelog';
import * as Chalk from 'chalk';
import {
  ExternalEditor,
  CreateFileError,
  LaunchEditorError,
  ReadFileError,
  RemoveFileError,
} from 'external-editor';

Yargs.help()
  .demandCommand()
  .recommendCommands()
  .strict()
  .showHelpOnFail(true)
  .command('add', 'Add changes to the unreleased version', (yargs) => {
    yargs = yargs.demandCommand().recommendCommands().showHelpOnFail(true);

    for (const type of [
      'added',
      'changed',
      'deprecated',
      'removed',
      'fixed',
      'security',
    ] as const) {
      yargs = yargs.command(
        `${type} [change]`,
        `Insert a ${type} change in the unreleased version.`,
        (yargs) =>
          yargs
            .epilogue(
              `Hint: Make sure that you quote your change as a single shell string (ie: kacl add added "Change text"). Note that if no change text is provided you will be prompted to enter such text in your $EDITOR of choice.`
            )
            .positional('change', {
              type: 'string',
              description: 'The description of the change',
            })
            .options({
              filename: {
                default: 'CHANGELOG.md',
                description: 'The name of the changelog file to write',
              },
            }),
        async (argv) => {
          await getPackage();
          const changelog = await getChangelog(argv.filename);
          let unreleased = changelog.findRelease();

          if (!unreleased) {
            unreleased = new Release();
            changelog.addRelease(unreleased);
          }

          const changeText = await readChangeText(type, argv.change);

          unreleased.addChange(type, changeText);

          await Fs.writeFile(argv.filename, changelog.toString());

          console.error(Chalk.green(`✅ Wrote ${argv.filename}`));
          process.exit(0);
        }
      );
    }

    return yargs;
  })
  .command(
    'init',
    'Initialize an empty CHANGELOG.md',
    {
      filename: {
        default: 'CHANGELOG.md',
        description: 'The name of the changelog file to write',
      },
      force: {
        boolean: true,
        description: 'Overwrite an existing file, if it exists.',
      },
    } as const,
    async (argv) => {
      let file: Fs.FileHandle;

      try {
        file = await Fs.open(argv.filename, argv.force ? 'w' : 'wx');
      } catch (err) {
        console.error(
          Chalk.red(
            `❌ Error while attempting to take an exclusive read on ${
              argv.filename
            }:\n  ${Chalk.dim(err.message)}`
          )
        );
        process.exit(1);
      }

      const pkg = await getPackage();
      const changelog = new Changelog('Changelog');
      changelog.addRelease(new Release());
      changelog.url = pkg.repository.url;

      await file.writeFile(changelog.toString());
      console.error(Chalk.green(`✅ Wrote ${argv.filename}`));
      process.exit(0);
    }
  )
  .command(
    'lint',
    'Check the format of your changelog',
    (yargs) =>
      yargs
        .epilogue(
          `Hint: You should consider adding this as your ${Chalk.bold(
            'posttest'
          )} command in package.json.`
        )
        .options({
          filename: {
            default: 'CHANGELOG.md',
            description: 'The name of the changelog file to write',
          },
        } as const),
    async (argv) => {
      await getPackage();
      await getChangelog(argv.filename);

      console.error(Chalk.green('✅ Changelog is valid'));
      process.exit(0);
    }
  )
  .command(
    'prerelease',
    'Check the requirements for creating a release',
    (yargs) =>
      yargs
        .epilogue(
          `Hint: You should consider adding this as your ${Chalk.bold(
            'prerelease'
          )} command in package.json.`
        )
        .options({
          filename: {
            default: 'CHANGELOG.md',
            description: 'The name of the changelog file to write',
          },
        } as const),
    async (argv) => {
      await getPackage();
      const changelog = await getChangelog(argv.filename);

      for (const release of changelog.releases) {
        if (!release || release.isEmpty()) {
          console.error(`❌ No changes to the Changelog for release in ${argv.filename}`);
          process.exit(1);
        }
      }
    }
  )
  .command(
    'release',
    'Create a new release',
    (yargs) =>
      yargs
        .epilogue(
          `Hint you should consider adding the following as your ${Chalk.bold(
            'version'
          )} script in package.json: ${Chalk.bold('kacl release && git add CHANGELOG.md')}`
        )
        .options({
          filename: {
            default: 'CHANGELOG.md',
            description: 'The name of the changelog file to write',
          },
        } as const),
    async (argv) => {
      const pkg = await getPackage();
      const changelog = await getChangelog(argv.filename);
      changelog.url = pkg.repository.url;

      const unreleased = changelog.findRelease();
      const existingRelease = changelog.findRelease(pkg.version);

      if (!existingRelease) {
        if (!unreleased || unreleased.isEmpty()) {
          console.error(
            Chalk.red(`❌ No changes to the Changelog for release in ${argv.filename}`)
          );
          process.exit(1);
        }

        unreleased.setVersion(pkg.version);
        unreleased.date = new Date();

        changelog.addRelease(new Release());

        await Fs.writeFile(argv.filename, changelog.toString());

        console.log(Chalk.green('Released Changelog!'));
      } else if (unreleased && !unreleased.isEmpty()) {
        console.error(
          Chalk.red("❌ Release already exists, did you mean to bump your package's version?")
        );
        process.exit(1);
      } else {
        console.log(Chalk.blue('🚫 Changelog is up-to-date, not performing a release'));
        process.exit(2);
      }
    }
  ).argv;

async function getChangelog(filename: string, mode: string = 'r') {
  let file: Fs.FileHandle | undefined;
  try {
    file = await Fs.open(filename, mode);
    const text = await file.readFile('utf8');
    const changelog = parser(text);

    return changelog;
  } catch (err) {
    throw new Error(`Unable to read changelog: ${err.message}`);
  } finally {
    file?.close();
  }
}

async function getPackage() {
  let pkg: {
    repository: {
      url: string;
    };
    version: string;
  };
  try {
    const json = await Fs.readFile('package.json', 'utf8');
    pkg = JSON.parse(json);
  } catch (err) {
    throw new Error(`Unable to access package.json: ${err.message}`);
  }

  if (!pkg.repository || !pkg.repository.url) {
    throw new Error('No repository URL found in package.json');
  }

  pkg.repository.url = getPackageUrl(pkg.repository.url);

  if (!/^https?:\/\//.test(pkg.repository.url)) {
    throw new Error('Repository URL in package.json must be a valid URL to a git repository');
  }
  return pkg;
}

function getPackageUrl(packageUrl: string) {
  packageUrl = packageUrl
    //trim git+ from the front of the URL
    .replace(/^git\+/, '')
    //convert ssh://, ssh://git@, or just git@ to https://
    .replace(/^(?:ssh:\/\/(?:git@)?|git@)/, 'https://');

  const parsed = Url.parse(packageUrl);

  if (parsed.pathname) {
    parsed.pathname = parsed.pathname
      //replace the leading : for ssh paths with / (and pull the port out of the parsed path)
      .replace(/\/:(?:(\d+):)?/, (match, port) => {
        if (!parsed.port && port) {
          parsed.port = port;
          parsed.host += ':' + port;
        }
        return '/';
      })
      //replace the trailing .git
      .replace(/\.git$/, '');
  }

  return Url.format(parsed);
}

async function readChangeText(changeKind: string, text?: string) {
  if (text) {
    return text;
  }

  const editor = new ExternalEditor(
    `[//]: # (Add your description for the ${changeKind} change in markdown format below)\n\n`,
    { postfix: '.md' }
  );

  try {
    const text = editor.run(); // the text is also available in editor.text

    if (editor.last_exit_status !== 0) {
      throw new Error('The editor exited with a non-zero code');
    }

    const trimmedText = text.replace(/^\[\/\/\].*$/gm, '').trim();

    if (!trimmedText) {
      throw new Error(`No change text was provided, aborting`);
    }

    return trimmedText;
  } catch (err) {
    if (err instanceof CreateFileError) {
      throw new Error('Failed to create the temporary file');
    } else if (err instanceof ReadFileError) {
      throw new Error('Failed to read the temporary file');
    } else if (err instanceof LaunchEditorError) {
      throw new Error('Failed to launch your editor');
    } else {
      throw err;
    }
  } finally {
    // Eventually call the cleanup to remove the temporary file
    try {
      editor.cleanup();
    } catch (err) {
      if (err instanceof RemoveFileError) {
        console.warn('Failed to remove the temporary file');
      } else {
        throw err;
      }
    }
  }
}
