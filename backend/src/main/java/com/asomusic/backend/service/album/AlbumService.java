package com.asomusic.backend.service.album;

import com.asomusic.backend.model.dto.AlbumPreviewDTO;
import com.asomusic.backend.repository.album.IAlbumRepository;
import com.asomusic.backend.service.storage.FirebaseStorageService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class AlbumService implements IAlbumService {

    @Inject
    IAlbumRepository albumRepository;

    @Inject
    FirebaseStorageService firebaseStorageService;

    @Override
    public List<AlbumPreviewDTO> fetchAllAlbumsPreview() {
        try {
            return albumRepository.fetchAllAlbumsPreview()
                    .stream()
                    .map(this::convertUrls)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new RuntimeException("❌ Errore durante il recupero degli album", e);
        }
    }

    @Override
    public AlbumPreviewDTO unlockAlbum(String albumId) {
        try {
            albumRepository.updateAlbumAvailability(albumId, true);
            return albumRepository.fetchAlbumPreviewById(albumId);
        } catch (Exception e) {
            throw new RuntimeException("❌ Errore durante lo sblocco dell'album " + albumId, e);
        }
    }


    private AlbumPreviewDTO convertUrls(AlbumPreviewDTO album) {
        return AlbumPreviewDTO.builder()
                .id(album.getId())
                .name(album.getName())
                .artist(album.getArtist())
                .releaseYear(album.getReleaseYear())
                .coverURL(firebaseStorageService.generateSignedUrl(album.getCoverURL()))
                .available(album.isAvailable())
                .build();
    }
}
