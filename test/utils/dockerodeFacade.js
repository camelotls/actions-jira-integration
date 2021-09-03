const Docker = require('dockerode');
const got = require('got');
const lodash = require('lodash');
const Spinner = require('cli-spinner').Spinner;
const docker = new Docker();

const pullImageAndSpawnContainer = (callback, setContainerId, auth, jiraEndpointTestReadyState) => {
  docker.pull(
    'ghcr.io/camelotls/jira-development/jira-dev:latest',
    { authconfig: auth },
    (err, stream) => {
      if (err) {
        callback(err);
        throw err;
      }
      docker.modem.followProgress(stream, onFinished);

      function onFinished (err, _) {
        if (err) {
          callback(err);
          throw err;
        }
        createAndStartContainer(callback, setContainerId, jiraEndpointTestReadyState);
      }
    }
  );
};

const createAndStartContainer = (callback, setContainerId, jiraEndpointTestReadyState) => {
  docker.createContainer(
    {
      Image: 'ghcr.io/camelotls/jira-development/jira-dev:latest',
      name: 'int-test-co',
      Tty: true,
      ExposedPorts: { '8080/tcp': {} },
      PortBindings: { '8080/tcp': [{ HostPort: '8080' }] }
    },
    (err, container) => {
      if (err) {
        callback(err);
      }
      console.log(`Created container with id ${container.id}...`);
      const spinner = new Spinner('Waiting for the service to start...');
      spinner.setSpinnerString(19);
      spinner.start();
      container.start((_1, _2) => {
        got.get(jiraEndpointTestReadyState,
          {
            retry: {
              limit: 15
            }
          }).then(async response => {
          callback();
          setContainerId(container.id);
          spinner.stop(true);
        }).catch(error => {
          console.log(error);
          spinner.stop(false);
        });
      });
    }
  );
};

const stopAllContainers = (callback) => {
  docker.listContainers({ all: true }, (_, containers) => {
    if (!lodash.isEmpty(containers)) {
      containers.forEach((containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);
        container.stop((err, _) => {
          if (err) {
            console.error(`Container with id ${container.id} coulnd't be stopped!`);
          }
          console.log(`Attempting to remove container with id ${container.id}...`);
          container.remove((err, _) => {
            console.log(`Container with id ${container.id} has been removed!`);
            if (err) {
              callback(err);
            }
            callback();
          });
        });
      });
    } else {
      console.log('No running containers have been found!');
    }
  });
};

module.exports = { pullImageAndSpawnContainer, stopAllContainers };
