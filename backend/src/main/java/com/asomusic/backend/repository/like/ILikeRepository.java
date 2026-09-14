package com.asomusic.backend.repository.like;

import com.asomusic.backend.model.dto.LikeMutationResultDTO;
import com.asomusic.backend.model.dto.SongLikesDTO;
import com.asomusic.backend.model.dto.UserLikedSongDTO;

import java.util.List;
import java.util.concurrent.ExecutionException;

public interface ILikeRepository {

    LikeMutationResultDTO addLike(
            String userId,
            String albumId,
            String songId,
            int likeLimit
    ) throws ExecutionException, InterruptedException;

    LikeMutationResultDTO removeLike(
            String userId,
            String albumId,
            String songId,
            int likeLimit
    ) throws ExecutionException, InterruptedException;

    SongLikesDTO fetchSongLikes(
            String userId,
            String albumId,
            String songId
    ) throws ExecutionException, InterruptedException;

    List<UserLikedSongDTO> fetchUserLikes(
            String userId
    ) throws ExecutionException, InterruptedException;
}
