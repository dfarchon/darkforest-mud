class BGMRadioPlugin {
  constructor() {
    this.queue = [];
    this.currentTrackIndex = 0;
    this.audioElement = null;
    this.youtubeIframe = null;
  }

  render(container) {
    container.style.width = "400px";
    container.style.height = "500px";
    container.style.border = "1px solid #ccc";
    container.style.padding = "15px";
    // container.style.backgroundColor = '#f4f4f9';
    container.style.borderRadius = "10px";
    container.style.overflowY = "auto"; // Enables vertical scrolling
    container.style.overflowX = "hidden"; // Disables horizontal scrolling

    container.innerHTML = `
        <div id="music-player">
          <h2 style="text-align: center; color: white;">🎵 BGM RADIO 🎵</h2>
          <audio id="audio-element" controls style="width: 100%; margin-top: 10px;"></audio>
          <iframe
            id="youtube-iframe"
            style="display: none; width: 100%; height: 200px; margin-top: 10px;"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

        <div style="margin-top: 15px;">
            <input type="file" id="file-input" accept="audio/*" multiple style="width: calc(100% - 20px);" />
            <input
            type="text"
            id="youtube-link"
            placeholder="YouTube link"
            style="width: calc(100% - 20px); margin-top: 10px;"
            />
            <button id="add-button" style="width: 100%; margin-top: 10px; padding: 10px; background: #6c757d; color: #fff; border: none; border-radius: 5px;">
            Add to Queue
            </button>
            </div>

          <ul id="queue-list" style="list-style: none; padding: 0; margin-top: 20px; max-height: 150px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;"></ul>

          <div style="margin-top: 20px; text-align: center;">
            <button id="prev-button" style="padding: 10px 20px; margin-right: 10px; background: #6c757d; color: #fff; border: none; border-radius: 5px;">
              Previous
            </button>
            <button id="next-button" style="padding: 10px 20px; background: #6c757d; color: #fff; border: none; border-radius: 5px;">
              Next
            </button>
          </div>
        </div>
      `;

    this.audioElement = container.querySelector("#audio-element");
    this.youtubeIframe = container.querySelector("#youtube-iframe");
    this.bindEvents(container);
  }

  bindEvents(container) {
    const fileInput = container.querySelector("#file-input");
    const youtubeInput = container.querySelector("#youtube-link");
    const addButton = container.querySelector("#add-button");
    const queueList = container.querySelector("#queue-list");
    const prevButton = container.querySelector("#prev-button");
    const nextButton = container.querySelector("#next-button");

    // Add tracks to queue
    addButton.addEventListener("click", () => {
      const youtubeLink = youtubeInput.value.trim();
      if (youtubeLink) {
        const videoId = this.extractYouTubeID(youtubeLink);
        if (videoId) {
          this.addToQueue({
            type: "youtube",
            url: `https://www.youtube.com/embed/${videoId}`,
            name: `YouTube Video`,
          });
          youtubeInput.value = "";
        } else {
          alert("Invalid YouTube URL!");
        }
      } else if (fileInput.files.length > 0) {
        Array.from(fileInput.files).forEach((file) => {
          this.addToQueue({
            type: "local",
            url: URL.createObjectURL(file),
            name: file.name,
          });
        });
        fileInput.value = ""; // Clear file input after processing
      }
      this.updateQueueList(queueList);
    });

    // Remove from queue
    queueList.addEventListener("click", (event) => {
      if (event.target.tagName === "BUTTON") {
        const index = parseInt(event.target.dataset.index, 10);
        this.removeFromQueue(index);
        this.updateQueueList(queueList);
      }
    });

    // Navigation
    prevButton.addEventListener("click", () => this.playPrevious());
    nextButton.addEventListener("click", () => this.playNext());
  }

  addToQueue(track) {
    this.queue.push(track);
    if (this.queue.length === 1) {
      this.playTrack(0);
    }
  }

  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      if (index === this.currentTrackIndex) {
        this.playTrack(this.currentTrackIndex);
      } else if (index < this.currentTrackIndex) {
        this.currentTrackIndex -= 1;
      }
    }
  }

  updateQueueList(queueList) {
    queueList.innerHTML = this.queue
      .map(
        (track, index) => `
          <li style="padding: 5px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">
            ${track.name || track.url}
            <button
            data-index="${index}"
            style="
                background: #dc3545;
                color: #fff;
                border: none;
                border-radius: 3px;
                padding: 5px 8px;
                font-size: 12px;
                cursor: pointer;
                box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
            "
            >
            ✖
            </button>
          </li>
        `,
      )
      .join("");
  }
  playTrack(index) {
    if (index >= 0 && index < this.queue.length) {
      const track = this.queue[index];
      this.currentTrackIndex = index;

      // Stop any currently playing audio or YouTube video
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = ""; // Reset the audio source
      }
      if (this.youtubeIframe) {
        this.youtubeIframe.style.display = "none";
        this.youtubeIframe.src = ""; // Reset the YouTube iframe source
      }

      // Play the selected track
      if (track.type === "local") {
        this.audioElement.style.display = "block";
        this.audioElement.src = track.url;
        this.audioElement.play();
      } else if (track.type === "youtube") {
        this.audioElement.style.display = "none";
        this.youtubeIframe.style.display = "block";
        this.youtubeIframe.src = `${track.url}?autoplay=1`;
      }
    }
  }

  playNext() {
    if (this.queue.length > 0) {
      // Stop the current track
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = "";
      }
      if (this.youtubeIframe) {
        this.youtubeIframe.style.display = "none";
        this.youtubeIframe.src = "";
      }

      // Play the next track
      const nextIndex = (this.currentTrackIndex + 1) % this.queue.length;
      this.playTrack(nextIndex);
    }
  }

  playPrevious() {
    if (this.queue.length > 0) {
      // Stop the current track
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.src = "";
      }
      if (this.youtubeIframe) {
        this.youtubeIframe.style.display = "none";
        this.youtubeIframe.src = "";
      }

      // Play the previous track
      const prevIndex =
        (this.currentTrackIndex - 1 + this.queue.length) % this.queue.length;
      this.playTrack(prevIndex);
    }
  }

  extractYouTubeID(url) {
    const regExp =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  }

  destroy() {
    this.audioElement?.pause();
    this.audioElement = null;
    this.youtubeIframe.src = "";
    this.queue = [];
  }
}

export default BGMRadioPlugin;
