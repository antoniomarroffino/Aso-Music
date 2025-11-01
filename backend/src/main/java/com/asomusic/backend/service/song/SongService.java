package com.asomusic.backend.service.song;

import com.asomusic.backend.model.dto.AlbumDTO;
import com.asomusic.backend.model.dto.ArtistDTO;
import com.asomusic.backend.model.dto.SongDTO;
import com.asomusic.backend.repository.artist.IArtistRepository;
import com.asomusic.backend.repository.song.ISongRepository;
import com.asomusic.backend.service.storage.FirebaseStorageService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@ApplicationScoped
public class SongService implements ISongService {

    @Inject
    ISongRepository songRepository;

    @Inject
    IArtistRepository artistRepository;

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
            throw new RuntimeException("Errore durante il recupero dei brani", e);
        }
    }

    private AlbumDTO convertAlbumStorageUrlsSafe(AlbumDTO album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .description(album.getDescription())
                .coverURL(firebaseStorageService.generateSignedUrl(album.getCoverURL())) // ✅ Signed
                .releaseYear(album.getReleaseYear())
                .songs(album.getSongs() == null ? List.of() :
                        album.getSongs().stream()
                                .map(this::convertSongStorageUrlsAndArtists)
                                .collect(Collectors.toList()))
                .build();
    }

    private SongDTO convertSongStorageUrlsAndArtists(SongDTO song) {
        SongDTO processed = SongDTO.builder()
                .id(song.getId())
                .title(song.getTitle())
                .duration(song.getDuration())
                .audioURL(firebaseStorageService.generateSignedUrl(song.getAudioURL()))
                .coverURL(firebaseStorageService.generateSignedUrl(song.getCoverURL())) // ✅ Signed
                .stream(song.getStream())
                .tracklistPosition(song.getTracklistPosition())
                .build();

        System.out.println("✅ Final audio URL sent to frontend: " + processed.getAudioURL());


        if (song.getArtists() != null && !song.getArtists().isEmpty()) {
            List<ArtistDTO> resolvedArtists = song.getArtists().stream()
                    .map(this::fetchArtistFromReference)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            processed.setArtists(resolvedArtists);
        }

        return processed;
    }

    private ArtistDTO fetchArtistFromReference(ArtistDTO artistRef) {
        try {
            String ref = artistRef.getId();
            if (ref == null || ref.isBlank()) return null;

            ArtistDTO artist = artistRepository.fetchArtistById(ref);

            if (artist != null) {
                artist.setProfileURL(firebaseStorageService.generateSignedUrl(artist.getProfileURL())); // ✅ Signed
            }

            return artist;

        } catch (Exception e) {
            System.err.println("⚠️ Errore durante il recupero dell'artista: " + e.getMessage());
            return null;
        }
    }
}