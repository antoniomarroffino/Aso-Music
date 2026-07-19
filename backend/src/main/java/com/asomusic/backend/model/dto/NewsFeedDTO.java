package com.asomusic.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsFeedDTO {

    /**
     * Tutte le news, comprese quelle già viste.
     */
    private List<NewsDTO> news;

    /**
     * Numero delle news non ancora viste.
     */
    private long unreadCount;

    /**
     * Sequenza massima inclusa nella risposta.
     *
     * Il frontend la invia a /news/mark-seen
     * dopo avere effettivamente mostrato la lista.
     */
    private long readCursor;
}