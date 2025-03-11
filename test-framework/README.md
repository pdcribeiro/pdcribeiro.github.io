# test-framework

## rough UX

* user writes test file path and clicks button
* loads test file
* runs tests in iframe
* displays test results


## rough UI

* input to enter test file path
* button to run tests
* span with pass/fail count
* list of results
* iframe for end-to-end tests

list of results
* p with
  - test result
  - text params passed in describe calls
  - test name
* if failed: p with
  - error message
  - stack trace 


## core functionality

* A web app that runs end-to-end JS tests on the browser
* Displays result of each test
* Follows typical naming conventions (test(), expect(), etc.)


## problem

* Test frameworks are bloated
