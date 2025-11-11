package com.asomusic.backend.repository.news;

import com.asomusic.backend.model.dto.NewsDTO;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@ApplicationScoped
public class NewsRepository implements INewsRepository {

    private final Firestore db = FirestoreClient.getFirestore();

    @Override
    public List<NewsDTO> fetchAllNews() throws ExecutionException, InterruptedException {
        List<NewsDTO> newsList = new ArrayList<>();

        ApiFuture<QuerySnapshot> future = db.collection("news")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> docs = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : docs) {
            NewsDTO news = NewsDTO.builder()
                    .id(doc.getId())
                    .message(doc.getString("message"))
                    .createdAt(doc.getString("createdAt"))
                    .build();

            newsList.add(news);
        }

        return newsList;
    }
}
