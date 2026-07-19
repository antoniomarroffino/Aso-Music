package com.asomusic.backend.model.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MarkNewsSeenRequestDTO {

    @NotNull(message = "Il cursore di lettura è obbligatorio")
    @PositiveOrZero(
            message = "Il cursore di lettura non può essere negativo"
    )
    private Long upToSequence;
}