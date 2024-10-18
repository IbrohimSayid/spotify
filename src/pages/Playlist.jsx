import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Loader2 } from 'lucide-react';
import { fetchPlaylist, setCurrentTrack, setIsPlaying, toggleLike, setPlaylist } from '../features/spotifySlice';
import MusicControlPanel from '../components/MusicControlPanel';

export default function PlaylistView() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentPlaylist, likedSongs, accessToken, currentTrack, isPlaying } = useSelector((state) => state.spotify);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accessToken && id && (!currentPlaylist || currentPlaylist.id !== id)) {
      setIsLoading(true);
      dispatch(fetchPlaylist({ accessToken, id }))
        .then(() => setIsLoading(false))
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [accessToken, id, dispatch, currentPlaylist]);

  useEffect(() => {
    return () => {
      dispatch({ type: 'RESET_CURRENT_PLAYLIST' });
    };
  }, [dispatch]);

  useEffect(() => {
    if (currentPlaylist && currentPlaylist.tracks) {
      dispatch(setPlaylist(currentPlaylist.tracks.items.map(item => item.track)));
    }
  }, [currentPlaylist, dispatch]);

  const handlePlayPause = (track) => {
    if (currentTrack?.id === track.id) {
      dispatch(setIsPlaying(!isPlaying));
    } else {
      dispatch(setCurrentTrack(track));
      dispatch(setIsPlaying(true));
    }
  };

  const handleLike = (song) => {
    dispatch(toggleLike(song));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <Loader2 className="w-12 h-12 text-[#1ed760] animate-spin" />
      </div>
    );
  }

  if (!currentPlaylist || !currentPlaylist.tracks) {
    return <div className="text-white text-center p-8">Playlistni yuklashda xatolik yuz berdi.</div>;
  }

  const tracks = currentPlaylist.tracks?.items || [];
  const totalDuration = tracks.reduce((acc, item) => acc + (item.track?.duration_ms || 0), 0);

  return (
    <div className="bg-gradient-to-b from-[#535353] to-[#121212] min-h-screen text-white p-8 pb-24">
      <div className="flex items-end gap-6 mb-6">
        <img
          src={currentPlaylist.images?.[0]?.url || "/api/placeholder/232/232"}
          alt={currentPlaylist.name}
          className="w-[232px] h-[232px] shadow-2xl"
        />
        <div>
          <p className="text-xs font-bold uppercase mb-2">PLAYLIST</p>
          <h1 className="text-8xl font-bold mb-6">{currentPlaylist.name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{currentPlaylist.owner?.display_name} tomonidan</span>
            <span>•</span>
            <span className="text-gray-200">{tracks.length} qo'shiq, {formatDuration(totalDuration)}</span>
          </div>
        </div>
      </div>

      <div className="w-full mb-24">
        <table className="w-full table-auto text-gray-200 text-sm">
          <thead>
            <tr className="border-b border-white text-gray-400 select-none">
              <th className="text-left pb-2 w-12">#</th>
              <th className="text-left pb-2">TITLE</th>
              <th className="text-left pb-2">ALBUM</th>
              <th className="text-left pb-2">DATE ADDED</th>
              <th className="text-right pb-2 pr-8">ACTIONS</th>
            </tr>
          </thead>

          <tbody>
            {tracks.length > 0 ? (
              tracks.map((item, index) => {
                const song = item?.track;
                if (!song) return null;
                const isLiked = likedSongs.some(s => s.id === song.id);
                const isCurrentlyPlaying = currentTrack?.id === song.id && isPlaying;
                return (
                  <tr
                    key={`${song.id}-${index}`}
                    className={`hover:bg-white/10 group rounded-md transition-colors ${isCurrentlyPlaying ? 'bg-white/20' : ''}`}
                  >
                    <td className="py-5 w-12">
                      <button onClick={() => handlePlayPause(song)} className="invisible group-hover:visible">
                        {isCurrentlyPlaying ?
                          <Pause size={16} className="text-[#1ed760]" /> :
                          <Play size={16} />
                        }
                      </button>
                      <span className={`visible group-hover:invisible ${isCurrentlyPlaying ? 'text-[#1ed760]' : ''}`}>{index + 1}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={song.album.images[0]?.url || "/api/placeholder/40/40"}
                          alt={song.name}
                          className={`w-10 h-10 ${isCurrentlyPlaying ? 'animate-pulse' : ''}`}
                        />
                        <div>
                          <div className={`font-normal ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white'}`}>{song.name}</div>
                          <div className="text-gray-400">{song.artists.map(a => a.name).join(', ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-400">{song.album.name}</td>
                    <td className="text-gray-400">{formatDate(item.added_at)}</td>
                    <td className="text-gray-400 text-right pr-8">
                      <button onClick={() => handleLike(song)} className="mr-4 invisible group-hover:visible">
                        <Heart size={16} fill={isLiked ? "#1ed760" : "none"} stroke={isLiked ? "#1ed760" : "currentColor"} />
                      </button>
                      {formatDuration(song.duration_ms)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-400">Qo'shiqlar topilmadi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <MusicControlPanel />
    </div>
  );
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' });
}