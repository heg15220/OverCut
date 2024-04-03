package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Comment;

import java.util.List;
import java.util.stream.Collectors;

public class CommentConversor {
    /**
     * Generates a CommentDto from a Comment.
     *
     * @param comment the original Comment
     * @return the corresponding CommentDto
     */
    public static final CommentDto toCommentDto(Comment comment) {
        if (comment.getParentComment() != null) {
            return new CommentDto(comment.getId(), comment.getParentComment().getId(), comment.getUser().getId(),
                    comment.getContent(), comment.getPost().getId(), comment.getUser().getUserName(),
                    comment.getUser().getImage());
        } else {
            return new CommentDto(comment.getId(), null, comment.getUser().getId(), comment.getContent(),
                    comment.getPost().getId(), comment.getUser().getUserName(), comment.getUser().getImage());
        }

    }


    /**
     * Creates a List of commentDtos from a list of comments.
     *
     * @param comments the list of Comment
     * @return the corresponding list of CommentDtos
     */
    public static final List<CommentDto> toCommentDtos(List<Comment> comments) {
        return comments.stream().map(CommentConversor::toCommentDto).collect(Collectors.toList());

    }

    /**
     * Instantiates a new comment conversor.
     */
    private CommentConversor() {
    }
}
