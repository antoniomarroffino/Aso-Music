package com.asomusic.backend.repository.artist;

import com.asomusic.backend.model.dto.ArtistDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class ArtistRepository implements IArtistRepository {

    private static final String COLLECTION_NAME = "artists";

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    @Override
    public List<ArtistDTO> fetchAllArtists() throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        CollectionReference artistsRef = db.collection(COLLECTION_NAME);

        ApiFuture<QuerySnapshot> query = artistsRef.get();
        List<QueryDocumentSnapshot> documents = query.get().getDocuments();

        List<ArtistDTO> artists = new ArrayList<>();

        for (QueryDocumentSnapshot doc : documents) {
            ArtistDTO artist = doc.toObject(ArtistDTO.class);
            artist.setId(doc.getId());
            artists.add(artist);
        }

        System.out.println("🎨 Recuperati " + artists.size() + " artisti da Firestore.");
        return artists;
    }

    @Override
    public ArtistDTO fetchArtistById(String artistId) throws ExecutionException, InterruptedException {
        Firestore db = getFirestore();
        DocumentReference docRef = db.collection(COLLECTION_NAME).document(artistId);

        DocumentSnapshot docSnap = docRef.get().get();

        if (docSnap.exists()) {
            ArtistDTO artist = docSnap.toObject(ArtistDTO.class);
            if (artist != null) {
                artist.setId(docSnap.getId());
            }
            System.out.println("🎤 Artista trovato: " + artist.getName());
            return artist;
        } else {
            System.out.println("⚠️ Nessun artista trovato con ID: " + artistId);
            return null;
        }
    }
}
