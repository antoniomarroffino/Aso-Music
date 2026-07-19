package com.asomusic.backend.service.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.asomusic.backend.repository.album.IAlbumRepository;
import com.asomusic.backend.service.storage.IStorageUrlService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class AlbumService implements IAlbumService {

    @Inject
    IAlbumRepository albumRepository;

    @Inject
    IStorageUrlService storageUrlService;

    @Override
    public List<AlbumPreviewDTO> fetchAllAlbumsPreview() {
        try {
            return albumRepository.fetchAllAlbumsPreview()
                    .stream()
                    .map(this::convertUrls)
                    .toList();
        } catch (Exception e) {
            throw new RuntimeException(
                    "Errore durante il recupero degli album",
                    e
            );
        }
    }

    @Override
    public AlbumPreviewDTO unlockAlbum(String albumId) {
        try {
            albumRepository.updateAlbumAvailability(
                    albumId,
                    true
            );

            AlbumPreviewDTO album =
                    albumRepository.fetchAlbumPreviewById(albumId);

            if (album == null) {
                throw new IllegalStateException(
                        "Album non trovato: " + albumId
                );
            }

            return convertUrls(album);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Errore durante lo sblocco dell'album " + albumId,
                    e
            );
        }
    }

    private AlbumPreviewDTO convertUrls(AlbumPreviewDTO album) {
        return AlbumPreviewDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .releaseDate(album.getReleaseDate())
                .coverURL(resolveStorageUrl(album.getCoverURL()))
                .available(album.isAvailable())
                .availableAt(album.getAvailableAt())
                .build();
    }

    private String resolveStorageUrl(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) {
            return null;
        }

        return storageUrlService.getSignedUrl(storagePath);
    }
}