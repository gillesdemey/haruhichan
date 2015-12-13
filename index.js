'use strict'

var _ = require('lodash')
var debug = require('debug')('haru')
var nets = require('nets')
var Promise = require('bluebird')
var xtend = require('xtend')

var API_URL = 'http://ptp.haruhichan.com/'
var SHOW_STATUS = {
  0: 'Not Airing Yet',
  1: 'Currently Airing',
  2: 'Ended'
}

function Haruhichan (opts) {
  opts = xtend(opts || {}, { endpoint: API_URL })
  this.endpoint = opts.endpoint
}

Haruhichan.prototype = {

  search: function (q, opts) {
    debug('searching for "%s" with options %j', q, opts)
    opts = xtend(opts || {}, { search: q })
    return this.list(opts)
  },

  list: function (opts) {
    debug('listing all show with options %j', opts)
    opts = xtend(opts || {}, { sort: 'popularity', order: 'desc' })
    return makeRequest(API_URL + 'list.php', opts)
      .then(mapShows)
  },

  info: function (id, opts) {
    debug('fetching show with id %d and options %j', id, opts)
    return makeRequest(API_URL + 'anime.php', { id: id })
      .then(mapShow)
      .bind(this)
      .then(function (show) { return filterEpisodes(show, opts) })
  }

}

/**
 * Filter for specific episodes
 */
function filterEpisodes (show, opts) {
  debug('filtering %d episodes with %j', show.episodes.length, opts)
  // itterate over filter options
  _.forOwn(opts, function (value, key) {
    switch (key) {
      case 'quality':
        show.episodes = _.filter(show.episodes, function (episode) {
          return !!episode.quality.match(new RegExp(opts.quality))
        })
        break
      case 'subgroup':
        show.episodes = _.filter(show.episodes, function (episode) {
          return episode.subgroup.toLowerCase() === opts.subgroup.toLowerCase()
        })
        break
      default:
        show.episodes = _.filter(show.episodes, _.zipObject([[key, value]]))
    }
  })
  return show
}

/**
 * Map an array of shows
 */
function mapShows (shows) {
  return shows.map(function (show) {
    // split genres into array
    show.genres = splitIntoArray(show.genres)
    // sanitize strings
    Object.keys(show).map(function (key) {
      if (typeof show[key] === 'string') show[key] = sanitizeString(show[key])
    })
    // map status
    show.status = SHOW_STATUS[show.status]
    return show
  })
}

/**
 * Map a show
 */
function mapShow (show) {
  // sanitize strings
  Object.keys(show).map(function (key) {
    if (typeof show[key] === 'string') show[key] = sanitizeString(show[key])
  })
  // id -> integer
  show.id = parseInt(show.id, 10)
  // parse producers
  show.producers = splitIntoArray(show.producers)
  // parse episode numbers
  show.episodes.map(function (ep) {
    var match = ep.name.match(/[\s_]([0-9]+(-[0-9]+)?|CM|OVA)[\s_]/)
    if (match) ep.episode = parseInt(match[1], 10)
  })
  // sort episodes
  show.episodes.sort(function (a, b) {
    return a.episode - b.episode
  })
  return show
}

function sanitizeString (string) {
  if (typeof string !== 'string') return string
  return string
    .trim()
    .replace('\\n', '')
}

function splitIntoArray (string) {
  if (typeof string !== 'string') return string
  return string.split(',').map(function (v) {
    return v.trim()
  })
}

function makeRequest (url, opts) {
  debug(url, opts)
  return new Promise(function (resolve, reject) {
    var req = nets({ url: url, qs: opts, json: true }, function (err, resp, body) {
      if (err) return reject(err)
      else return resolve(body)
    })
    debug('Sending request to %j', require('url').format(req.uri))
  })
}

module.exports = Haruhichan
