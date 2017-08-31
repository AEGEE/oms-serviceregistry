const request = require('request-promise');
const assert = require('assert');
const registry_url = "http://omsserviceregistry:7000";



async function test() {
  try {
    var response = await request({
      url: registry_url + '/services',
      json: true
    });

    assert(Array.isArray(response.data))
    assert(response.data.length > 0)

    var response = await request({
      url: registry_url + '/services/testservice1',
      json: true
    });

    assert.equal(response.data.name, 'testservice1')
    assert.equal(response.data.frontend_url, '/services/test1')

    var response = await request({
      url: registry_url + '/services/testservice2',
      json: true
    });

    assert.equal(response.data.name, 'testservice2')
    assert.equal(response.data.frontend_url, '/services/test2')
    assert.equal(response.data.up, true)
    assert(response.data.modules)
    assert.equal(response.data.modules.code, 'omsevents')


    console.log("All tests passed successfully");
  } catch(e) {
    console.error(e);
    process.exit(-1);
  }
}

test();


