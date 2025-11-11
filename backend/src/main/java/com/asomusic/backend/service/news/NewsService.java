package com.asomusic.backend.service.news;

import com.asomusic.backend.model.dto.NewsDTO;
import com.asomusic.backend.repository.news.INewsRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class NewsService implements INewsService {

    @Inject
    INewsRepository newsRepository;

    @Override
    public List<NewsDTO> fetchAllNews() {
        try {
            return newsRepository.fetchAllNews();
        } catch (Exception e) {
            throw new RuntimeException("❌ Errore durante il recupero delle news", e);
        }
    }
}
