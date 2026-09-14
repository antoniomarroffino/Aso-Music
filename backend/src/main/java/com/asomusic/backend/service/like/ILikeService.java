package com.asomusic.backend.service.like;

import com.asomusic.backend.model.dto.LikeMutationResultDTO;
import com.asomusic.backend.model.dto.SongLikesDTO;
import com.asomusic.backend.model.dto.UserLikesDTO;

public interface ILikeService {

    UserLikesDTO fetchUserLikes(String userId);

    SongLikesDTO fetchSongLikes(
            String userId,
            String albumId,
            String songId
    );

    LikeMutationResultDTO addLike(
            String userId,
            String albumId,
            String songId
    );

    LikeMutationResultDTO removeLike(
            String userId,
            String albumId,
            String songId
    );
}
