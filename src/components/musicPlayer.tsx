// src/components/MusicPlayer.tsx
import { useState, useRef, useEffect, FC, SyntheticEvent } from 'react';
import ReactPlayer from 'react-player';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import dataJson from '../data/playlists.json';
import './musicPlayer.css';

//Interfaces for data structures
interface Track {
  name: string;
  url: string;
  duration: number;
}
interface Playlist {
  name: string;
  'artist:': string;
  year: number;
  tracks: Track[];
}
interface Data {
  playlists: Playlist[];
}
//Cast JSON data to Data interface
const data = dataJson as Data;
//MusicPlayer arguments
interface MusicPlayerProps {}

const MusicPlayer: FC<MusicPlayerProps> = () => {
  //Playlist and Track State
  const [selectedPlaylistIndex, setSelectedPlaylistIndex] = useState<number>(0);
  //Get the currently selected playlist and its tracks from the JSON data
  const playlist = data.playlists[selectedPlaylistIndex];
  const tracks = playlist.tracks;

  //Playback State and Timing
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [trackPlaying, setTrackPlaying] = useState<boolean>(false);
  const [trackRepeat, setTrackRepeat] = useState<boolean>(false);

  //Track progress is stored as a percentage (0 - 100)
  const [progress, setProgress] = useState<number>(0);
  //Current time in seconds and total duration of the track
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  //Refs for Player and UI Elements
  //Ref for the ReactPlayer component
  const playerRef = useRef<ReactPlayer | null>(null);
  //Ref for the container that holds track cards
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  //Array of refs for each individual track card
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  //Format a time in seconds to a mm:ss string
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  //ReactPlayer Callback Handlers
  //Update progress and current time based on ReactPlayer's progress event
  const handleTrackProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played * 100);
    setCurrentTime(state.playedSeconds);
  };

  //Set the total duration when ReactPlayer loads track
  const handleTrackDuration = (dur: number) => {
    setDuration(dur);
  };

  //Handle the end of a track; trackRepeat the track if trackRepeat mode is enabled, else move to next track
  const handleTrackEnd = () => {
    if (trackRepeat) {
      if (playerRef.current) {
        playerRef.current.seekTo(0, 'seconds');
      }
      setProgress(0);
      setCurrentTime(0);
      setTrackPlaying(true);
    } else {
      nextTrack();
    }
  };

  //Playback Control Functions
  //Update play/pause state
  const togglePlayPause = () => {
    setTrackPlaying((prev) => !prev);
  };

  //Move to the next track
  const nextTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
    setProgress(0);
    setCurrentTime(0);
  };
  //Move to the previous track
  const prevTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + tracks.length) % tracks.length);
    setProgress(0);
    setCurrentTime(0);
  };
  //Buffer backward by 15 seconds
  const bufferBackward = () => {
    const newTime = Math.max(currentTime - 15, 0);
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, 'seconds');
    }
  };
  //Buffer forward by 15 seconds
  const bufferForward = () => {
    const newTime = currentTime + 15;
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, 'seconds');
    }
  };
  //Select a random track from the list
  const randomTrack = () => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    setCurrentTrackIndex(randomIndex);
    setProgress(0);
    setCurrentTime(0);
  };

  //Slider Handlers for Progress Bar
  //Update the progress state while the slider is being dragged
  const handleSliderChange = (
    _event: Event | SyntheticEvent<Element, Event>,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      setProgress(newValue);
    }
  };

  //When slider drag is finished, calculate new current track time and move to the new playback position 
  const handleSliderChangeOnFinish = (
    _event: Event | SyntheticEvent<Element, Event>,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      const newTime = (newValue / 100) * duration;
      if (playerRef.current) {
        playerRef.current.seekTo(newTime, 'seconds');
      }
      setCurrentTime(newTime);
    }
  };

  //When the current track index changes, scroll the corresponding track card into view
  useEffect(() => {
    const card = cardRefs.current[currentTrackIndex];
    if (card) {
      card.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentTrackIndex]);

  return (
    <div className="music-player">
      {/* Playlist dropdown */}
      <FormControl fullWidth variant="outlined" className="playlist-select">
        <InputLabel id="playlist-select-label">Playlist</InputLabel>
        <Select
          labelId="playlist-select-label"
          id="playlist-select"
          value={selectedPlaylistIndex}
          label="Playlist"
          onChange={(e: SelectChangeEvent<number>) => {
            const newIndex = Number(e.target.value);
            setSelectedPlaylistIndex(newIndex);
            setCurrentTrackIndex(0);
            setProgress(0);
            setCurrentTime(0);
          }}
          sx={{
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#1ED760",
            },
          }}
        >
          {data.playlists.map((pl, index) => (
            <MenuItem key={index} value={index}>
              {pl.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Playlist info */}
      <header className="playlist-header">
        <h1>{playlist.name}</h1>
        <p>
          {playlist["artist:"]} &mdash; {playlist.year}
        </p>
      </header>

      {/* Track cards */}
      <div className="track-cards-container" ref={cardsContainerRef}>
        {tracks.map((track, index) => (
          <div
            key={index}
            ref={(el) => (cardRefs.current[index] = el)}
            className={`track-card ${index === currentTrackIndex ? "active" : ""}`}
            onClick={() => {
              setCurrentTrackIndex(index);
              setProgress(0);
              setCurrentTime(0);
            }}
          >
            <h3>{track.name}</h3>
          </div>
        ))}
      </div>

      {/* ReactPlayer */}
      <ReactPlayer
        ref={playerRef}
        url={tracks[currentTrackIndex].url}
        playing={trackPlaying}
        onProgress={handleTrackProgress}
        onDuration={handleTrackDuration}
        onEnded={handleTrackEnd}
        width="0"
        height="0"
      />

      {/* Progress bar with time display */}
      <div className="progress-slider-container">
        <div className="time-container">
          <div className="time-current">{formatTime(currentTime)}</div>
          <Slider
            value={progress}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeOnFinish}
            aria-labelledby="progress-slider"
            valueLabelDisplay="off"
            sx={{ color: "#1ED760" }}
          />
          <div className="time-duration">{formatTime(duration)}</div>
        </div>
      </div>

      {/* Track Playback Controls */}
      <div className="controls">
        <IconButton onClick={() => setTrackRepeat(!trackRepeat)} aria-label="Toggle trackRepeat">
          {trackRepeat ? (
            <RepeatOneIcon fontSize="large" sx={{ color: "#1ED760" }} />
          ) : (
            <RepeatIcon fontSize="large" />
          )}
        </IconButton>
        <IconButton onClick={prevTrack}>
          <SkipPreviousIcon fontSize="large" />
        </IconButton>
        <IconButton onClick={bufferBackward}>
          <FastRewindIcon fontSize="large" />
        </IconButton>
        <IconButton onClick={togglePlayPause} aria-label={trackPlaying ? "Pause" : "Play"}>
          {trackPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
        </IconButton>
        <IconButton onClick={bufferForward}>
          <FastForwardIcon fontSize="large" />
        </IconButton>
        <IconButton onClick={nextTrack}>
          <SkipNextIcon fontSize="large" />
        </IconButton>
        <IconButton onClick={randomTrack}>
          <ShuffleIcon fontSize="large" />
        </IconButton>
      </div>
    </div>
  );
};

export default MusicPlayer;