package com.asomusic.backend.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SongService implements ISongService {

    @Override
    public void fetchAllSongs() {
        Firestore db = FirestoreClient.getFirestore();

        try {
            ApiFuture<QuerySnapshot> albumFuture = db.collection("album").get();
            List<QueryDocumentSnapshot> albumDocs = albumFuture.get().getDocuments();

            for (QueryDocumentSnapshot albumDoc : albumDocs) {
                String albumId = albumDoc.getId();
                System.out.println("📀 Album: " + albumDoc.getString("name") + " (ID: " + albumId + ")");

                // Sottocollezione songs
                ApiFuture<QuerySnapshot> songsFuture = db.collection("album")
                        .document(albumId)
                        .collection("songs")
                        .get();

                List<QueryDocumentSnapshot> songs = songsFuture.get().getDocuments();
                for (QueryDocumentSnapshot songDoc : songs) {
                    Map<String, Object> data = songDoc.getData();
                    System.out.println("🎵 Song: " + data.get("title") + ", duration: " + data.get("duration"));
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Error fetching songs: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

