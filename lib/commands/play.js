module.exports = {
  command: 'play [id|uri]',
  desc: 'Plays a Spotify resource from the last search results or URI',
  handler: function (argv) {
    if (!argv.id) {
      argv.db.logger.info('Playing tracklist')
      argv.db.mopidy.playback.play()
      return
    }

    if (Number.isInteger(argv.id)) {
      for (var type in argv.db.search.results) {
        for (var i = 0; i < argv.db.search.results[type].items.length; i++) {
          if (argv.db.search.results[type].items[i].hit === argv.id) {
            argv.uri = argv.db.search.results[type].items[i].uri
          }
        }
      }
    }

    if(typeof argv.uri === 'string') {
      // Spotify url support -> spotify:
      if(argv.uri.match('spotify')) {
        argv.uri = argv.uri.replace('https://open.spotify.com/', 'spotify:').replace('/', ':');
      }
      // Youtube url support -> yt:
      if(argv.uri.match('youtube')) {
        argv.uri = argv.uri.replace('https://www.youtube', 'yt:https://www.youtube');
      }
    }
    // Return if not raw MPD url (yt: / spotify:)
    if (typeof argv.uri !== 'string' || !argv.uri.match(/(spotify:album:.*)|(spotify:track:.*)|(yt:.*)/)) {
      return
    }

    argv.db.logger.info('Clearing tracklist')
    argv.db.mopidy.tracklist.clear()
    .then(function () {
      argv.db.emit('tracklist:clear')
      return argv.db.mopidy.tracklist.add(null, null, argv.uri)
    })
    .then(function (tracks) {
      argv.db.emit('tracklist:add', argv.message, tracks)
      return argv.db.mopidy.playback.play()
    })
    .catch(function () {})
    .done(function () {
      argv.db.post(argv.db.attachments.play(argv.uri))
    })
  }
}
