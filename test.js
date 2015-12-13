var _ = require('lodash')
var test = require('tape')
var Haruhichan = require('./')

test('should return results', function (t) {
  t.plan(2)

  var h = new Haruhichan()
  h.search('Gate', { type: 'TV' })
    .then(function (shows) {
      t.ok(shows.length >= 1, 'found at least one show')
      t.ok(_.every(shows, function (show) {
        return show.type === 'TV'
      }), 'shows have correct type')
    })
    .catch(t.end)
})

test('Should find a particular show', function (t) {
  t.plan(3)

  var h = new Haruhichan()
  h.info(65, { quality: 720, subgroup: 'HorribleSubs', episode: 1 })
    .then(function (show) {
      t.ok(show.id === 65, 'correct show found')

      t.ok(_.every(show.episodes, function (episode) {
        return !!episode.quality.match(/720p/)
      }), 'correct quality filter applied')

      t.ok(_.every(show.episodes, function (episode) {
        return episode.subgroup === 'HorribleSubs'
      }), 'correct subgroup filter applied')
    })
    .catch(t.end)
})
