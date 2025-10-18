class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audioPlayer');
        this.songs = [];
        this.queue = [];
        this.currentIndex = -1;
        this.isPlaying = false;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playIcon = document.getElementById('playIcon');
        this.pauseIcon = document.getElementById('pauseIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.repeatBtn = document.getElementById('repeatBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progress = document.getElementById('progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.durationEl = document.getElementById('duration');
        this.songTitle = document.getElementById('songTitle');
        this.songArtist = document.getElementById('songArtist');
        this.albumArt = document.getElementById('albumArt');
        this.playlist = document.getElementById('playlist');
        this.musicFiles = document.getElementById('musicFiles');
        this.searchInput = document.getElementById('searchInput');
        this.playlistStats = document.getElementById('playlistStats');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
    }

    attachEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.playPrevious());
        this.nextBtn.addEventListener('click', () => this.playNext());
        this.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        this.progressBar.addEventListener('click', (e) => this.seek(e));
        this.musicFiles.addEventListener('change', (e) => this.loadFiles(e));
        this.searchInput.addEventListener('input', () => this.filterSongs());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e));

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.playNext());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    loadFiles(event) {
        const files = Array.from(event.target.files);
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));

        this.songs = audioFiles.sort((a, b) => a.name.localeCompare(b.name));
        this.currentIndex = -1;
        this.queue = [];
        this.updateStats();
        this.renderPlaylist();

        if (this.songs.length > 0) {
            this.loadSong(0);
        }
    }

    renderPlaylist() {
        if (this.songs.length === 0) {
            this.playlist.innerHTML = '<div class="empty-state"><p>No music files loaded</p></div>';
            return;
        }

        const searchTerm = this.searchInput.value.toLowerCase();
        const filtered = this.songs.map((song, idx) => ({ song, idx }))
            .filter(({ song }) => song.name.toLowerCase().includes(searchTerm));

        this.playlist.innerHTML = filtered.map(({ song, idx }) => `
            <div class="song-item ${idx === this.currentIndex ? 'active' : ''} ${this.queue.includes(idx) ? 'queued' : ''}" data-index="${idx}">
                <div class="song-info">
                    <div class="song-name ${idx === this.currentIndex && this.isPlaying ? 'playing-indicator' : ''}">${this.getSongName(song.name)}</div>
                </div>
                <div class="song-actions">
                    <button class="action-btn" onclick="player.playSong(${idx})">Play</button>
                    <button class="action-btn" onclick="player.addToQueue(${idx})">${this.queue.includes(idx) ? 'Queued' : 'Queue'}</button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        this.playlistStats.textContent = `${this.songs.length} songs`;
    }

    getSongName(filename) {
        return filename.replace(/\.[^/.]+$/, '');
    }

    loadSong(index) {
        if (index < 0 || index >= this.songs.length) return;
        this.currentIndex = index;
        const song = this.songs[index];
        this.audio.src = URL.createObjectURL(song);
        this.songTitle.textContent = this.getSongName(song.name);
        this.songArtist.textContent = `Track ${index + 1} of ${this.songs.length}`;
        this.renderPlaylist();
    }

    playSong(index) {
        this.loadSong(index);
        this.play();
    }

    togglePlay() {
        if (this.currentIndex === -1 && this.songs.length > 0) this.loadSong(0);
        this.isPlaying ? this.pause() : this.play();
    }

    play() {
        this.audio.play();
        this.isPlaying = true;
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'block';
        this.albumArt.classList.add('playing-indicator');
        this.renderPlaylist();
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playIcon.style.display = 'block';
        this.pauseIcon.style.display = 'none';
        this.albumArt.classList.remove('playing-indicator');
        this.renderPlaylist();
    }

    playNext() {
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            this.playSong(next);
        } else if (this.isShuffle) {
            let next;
            do { next = Math.floor(Math.random() * this.songs.length); } while (next === this.currentIndex);
            this.playSong(next);
        } else if (this.currentIndex < this.songs.length - 1) {
            this.playSong(this.currentIndex + 1);
        } else if (this.isRepeat) {
            this.playSong(0);
        }
    }

    playPrevious() {
        if (this.currentIndex > 0) this.playSong(this.currentIndex - 1);
        else this.playSong(this.songs.length - 1);
    }

    addToQueue(index) {
        if (!this.queue.includes(index) && index !== this.currentIndex) {
            this.queue.push(index);
            this.renderPlaylist();
        }
    }

    seek(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }

    updateProgress() {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progress.style.width = `${percent}%`;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
    }

    updateDuration() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    setVolume(e) {
        const vol = e.target.value;
        this.audio.volume = vol / 100;
        this.volumeValue.textContent = `${vol}%`;
    }

    formatTime(sec) {
        if (isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2,'0');
        return `${m}:${s}`;
    }

    filterSongs() {
        this.renderPlaylist();
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.shuffleBtn.classList.toggle('active', this.isShuffle);
    }

    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.repeatBtn.classList.toggle('active', this.isRepeat);
    }
}

const player = new MusicPlayer();