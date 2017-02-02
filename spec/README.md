# Jasmine / Jenkins-CI JS Testing

The following can be used to run jasmine tests in Jenkins-CI using phantomjs. The JUnit plugin is then
used to publish the results.

```
PYENV_HOME=$WORKSPACE/pyenv/

# Delete previously built virtualenv
if [ -d $PYENV_HOME ]; then
    rm -rf $PYENV_HOME
fi

# Create virtualenv and install necessary packages
virtualenv --no-site-packages $PYENV_HOME
. $PYENV_HOME/bin/activate

pip install jasmine

rm -rf jasmine-reporters
git clone https://github.com/larrymyers/jasmine-reporters
cd jasmine-reporters
ln -s ../spec boadicea_spec
ln -s ../boadicea/local_apps/fh/static/js .
ln -s $PYENV_HOME/lib/python3.4/site-packages/jasmine_core jasmine-core
cp boadicea_spec/junit_xml_reporter.html examples/junit_xml_reporter_test.html
bin/phantomjs.runner.sh examples/junit_xml_reporter_test.html
```
