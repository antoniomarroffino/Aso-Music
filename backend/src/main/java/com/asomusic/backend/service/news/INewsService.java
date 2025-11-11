package com.asomusic.backend.service.news;

import com.asomusic.backend.model.dto.NewsDTO;
import java.util.List;

public interface INewsService {
    List<NewsDTO> fetchAllNews();
}
