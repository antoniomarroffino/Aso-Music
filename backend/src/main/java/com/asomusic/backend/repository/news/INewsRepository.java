package com.asomusic.backend.repository.news;

import com.asomusic.backend.model.dto.NewsDTO;
import java.util.List;
import java.util.concurrent.ExecutionException;

public interface INewsRepository {
    List<NewsDTO> fetchAllNews() throws ExecutionException, InterruptedException;
}
