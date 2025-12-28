package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.FirebaseStorageService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class SongService implements ISongService {

    @Inject
    ISongRepository songRepository;

    @Inject
    FirebaseStorageService firebaseStorageService;

    @Override
    public List<AlbumDTO> fetchAllSongs() {
        try {
            List<AlbumDTO> albums = songRepository.fetchAllAlbumsWithSongs();

            return albums.stream()
                    .map(this::convertAlbumStorageUrlsSafe)
                    .collect(Collectors.toList());

        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("❌ Errore durante il recupero dei brani", e);
        }
    }

    @Override
    public void incrementListenCount(String albumId, String songId) {
        try {
            songRepository.incrementListenCount(albumId, songId);
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("❌ Errore durante l'incremento degli ascolti", e);
        }
    }

    @Override
    public List<SongDTO> fetchSongsByAlbum(String albumId) {
        try {
            return songRepository.fetchSongsByAlbum(albumId)
                    .stream()
                    .map(song -> convertSongStorageUrlsSafe(song, albumId, null)) // 👈 nuovo overload
                    .collect(Collectors.toList());
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException("❌ Errore durante il recupero delle canzoni dell'album", e);
        }
    }

    private AlbumDTO convertAlbumStorageUrlsSafe(AlbumDTO album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(firebaseStorageService.generateSignedUrl(album.getCoverURL()))
                .releaseDate(album.getReleaseDate())
                .songs(album.getSongs() == null ? List.of() :
                        album.getSongs().stream()
                                .map(song ->
                                        convertSongStorageUrlsSafe(
                                                song,
                                                album.getId(),
                                                album.getName()
                                        )
                                )
                                .collect(Collectors.toList()))
                .build();
    }

    private SongDTO convertSongStorageUrlsSafe(SongDTO song, String albumId, String albumName) {
        return SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioURL(firebaseStorageService.generateSignedUrl(song.getAudioURL()))
                .coverURL(firebaseStorageService.generateSignedUrl(song.getCoverURL()))
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .artists(song.getArtists())
                .albumId(albumId)
                .albumName(albumName)
                .build();
    }
}
