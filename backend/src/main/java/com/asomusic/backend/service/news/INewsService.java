package com.asomusic.backend.service.news;

import com.asomusic.backend.model.dto.MarkNewsSeenRequestDTO;
import com.asomusic.backend.model.dto.NewsFeedDTO;
import com.asomusic.backend.model.dto.UnreadNewsCountDTO;

public interface INewsService {

    NewsFeedDTO fetchAllNews(
            String userId
    );

    UnreadNewsCountDTO fetchUnreadCount(
            String userId
    );

    UnreadNewsCountDTO markSeen(
            String userId,
            MarkNewsSeenRequestDTO request
    );

    /**
     * Crea una news globale.
     *
     * Usato internamente dall'applicazione, non dal controller pubblico.
     */
    long createNews(
            String message
    );
}