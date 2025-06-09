package overcut.rest.dtos;


import overcut.model.entities.PostBlock;
import overcut.model.entities.PostSection;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public class PostSectionConversor {
    public static List<PostSection> toPostSections(List<PostSectionDto> dtos) {
        return dtos.stream().map(dto -> {
            PostSection section = new PostSection();
            section.setTitle(dto.getTitle());
            section.setSectionOrder(dto.getSectionOrder());

            List<PostBlock> blocks = new ArrayList<>();
            for (PostBlockDto blockDto : dto.getBlocks()) {
                PostBlock block = new PostBlock();
                block.setType(blockDto.getType());
                block.setContent(blockDto.getContent());
                block.setBlockOrder(blockDto.getBlockOrder());
                if (blockDto.getImage() != null)
                    block.setImage(Base64.getDecoder().decode(blockDto.getImage()));
                blocks.add(block);
            }
            section.setBlocks(blocks);
            return section;
        }).toList();
    }

    public static List<PostSectionDto> toPostSectionDtos(List<PostSection> entities) {
        return entities.stream().map(section -> {
            PostSectionDto dto = new PostSectionDto();
            dto.setId(section.getId());
            dto.setTitle(section.getTitle());
            dto.setSectionOrder(section.getSectionOrder());

            List<PostBlockDto> blocks = new ArrayList<>();
            for (PostBlock block : section.getBlocks()) {
                PostBlockDto blockDto = new PostBlockDto();
                blockDto.setType(block.getType());
                blockDto.setContent(block.getContent());
                blockDto.setBlockOrder(block.getBlockOrder());
                if (block.getImage() != null)
                    blockDto.setImage(Base64.getEncoder().encodeToString(block.getImage()));
                blocks.add(blockDto);
            }
            dto.setBlocks(blocks);
            return dto;
        }).toList();
    }
}


