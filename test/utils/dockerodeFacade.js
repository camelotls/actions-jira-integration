const Docker = require('dockerode');

const docker = new Docker();

const pullImageAndSpawnContainer = (callback, setContainerId, auth) => {
  docker.pull(
    'docker.pkg.github.com/camelotls/jira-development/jira-dev:latest',
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
        createAndStartContainer(callback, setContainerId);
      }
    }
  );
};

const createAndStartContainer = (callback, setContainerId) => {
  docker.createContainer(
    {
      Image: 'docker.pkg.github.com/camelotls/jira-development/jira-dev:latest',
      name: 'int-test-co',
      Tty: true,
      ExposedPorts: { '8080/tcp': {} },
      PortBindings: { '8080/tcp': [{ HostPort: '8080' }] }
    },
    (err, container) => {
      if (err) {
        callback(err);
      }
      console.log(`created container with id ${container.id}`);
      container.start((err, data) => {
        callback();
        setContainerId(container.id);
      });
    }
  );
};

const stopAndRemoveContainer = (callback, containerId) => {
  const container = docker.getContainer(containerId);
  container.stop((err, _) => {
    if (err) {
      console.error(`container with id ${container.id} coulnd't be stopped`);
    }
    container.remove((err, _) => {
      console.log(`container with id ${container.id} is removed`);
      if (err) {
        callback(err);
      }
      callback();
    });
  });
};

module.exports = { pullImageAndSpawnContainer, stopAndRemoveContainer };
