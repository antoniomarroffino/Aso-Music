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

    private AlbumDTO convertAlbumStorageUrlsSafe(AlbumDTO album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(firebaseStorageService.generateSignedUrl(album.getCoverURL()))
                .releaseYear(album.getReleaseYear())
                .songs(album.getSongs() == null ? List.of() :
                        album.getSongs().stream()
                                .map(this::convertSongStorageUrlsSafe)
                                .collect(Collectors.toList()))
                .build();
    }

    private SongDTO convertSongStorageUrlsSafe(SongDTO song) {
        SongDTO processed = SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioURL(firebaseStorageService.generateSignedUrl(song.getAudioURL()))
                .coverURL(firebaseStorageService.generateSignedUrl(song.getCoverURL()))
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .artists(song.getArtists())
                .build();

        return processed;
    }
}
