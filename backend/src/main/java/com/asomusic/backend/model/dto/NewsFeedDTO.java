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

    private List<NewsDTO> news;
    private long unreadCount;
    private long readCursor;
}