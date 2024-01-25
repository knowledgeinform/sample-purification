const server = require('../../src/server.js')
const chai = require('chai')
const chaiHttp = require('chai-http')

// Configure chai
chai.use(chaiHttp)
chai.should()

/* global before */

describe('server API', () => {
  before(async () => {
    // runs once before the first test in this block
    var port = 3000
    var test = true
    await server.start(port, test)
    console.log('server running on port ' + port)
  })

  it('should get all services', done => {
    // console.log(this)
    chai.request(server.app)
    .get('/api')
    .end((_, res) => {
      res.should.have.status(200)
      res.body.should.be.a('array')
      // console.log(res.body)
      var services = res.body

      describe('should get all subservices', () => {
        services.forEach(service => {
          console.log('service: ' + service)
          it('should get all subservices for ' + service, done => {
            // console.log(this)
            chai.request(server.app)
            .get('/api/' + encodeURIComponent(service))
            .end((_, res) => {
              res.should.have.status(200)
              res.body.should.be.a('array')
              var subservices = res.body

              describe('should get all subservice objects for ' + service, () => {
                subservices.forEach(subservice => {
                  console.log(service + '/' + subservice)
                  it('should return an object for ' + service + '/' + subservice, done => {
                    chai.request(server.app)
                    .get('/api/' + encodeURIComponent(service) + '/' + encodeURIComponent(subservice))
                    .end((_, res) => {
                      res.should.have.status(200)
                      res.body.should.be.a('object')

                      var obj = res.body

                      describe('should return every field on GET request without crashing the software for ' + service + '/' + subservice, () => {
                        Object.entries(obj).forEach(([key]) => {
                          console.log(service + '/' + subservice + '/' + key)
                          it('should successfully return something for ' + service + '/' + subservice + '/' + key, done => {
                            chai.request(server.app)
                            .get('/api/' + encodeURIComponent(service) + '/' + encodeURIComponent(subservice) + '/' + encodeURIComponent(key))
                            .end((_, res) => {
                              if (key === 'datastreams' || key === 'updateable' || key === 'nonupdateable') {
                                res.should.have.status(404)
                              } else {
                                res.should.have.status(200)
                              }
                              done()
                            })
                          })
                        })
                      })

                      done()
                    })
                  })
                })
              })

              done()
            })
          })
        })
      })

      done()
    })
  })

  // describe('sub service', () => {
  //   var services
  //   before(async () => {
  //     await chai.request(server.app)
  //     .get('/api')
  //     .end((_, res) => {
  //       res.should.have.status(200)
  //       res.body.should.be.a('array')
  //
  //     })
  //   })
  //
  //   for (var service of services) {
  //     it('should get all subservices: ' + service, done => {
  //       // console.log(this)
  //       chai.request(server.app)
  //       .get('/api/' + service)
  //       .end((_, res) => {
  //         res.should.have.status(200)
  //         res.body.should.be.a('array')
  //         done()
  //       })
  //     })
  //   }
  // })
})
