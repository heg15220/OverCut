package es.udc.fic.tfg.rest.dtos;

import es.udc.fic.tfg.model.entities.Category;

import java.util.List;
import java.util.stream.Collectors;

public class CategoryConversor {

    private CategoryConversor(){

    }


    public static final CategoryDto toCategoryDto(Category category) {
        return new CategoryDto(category.getId(), category.getName(),category.isHistoric(), category.isQuiz());
    }

    public static final List<CategoryDto> toCategoryDtos(List<Category> categories) {
        return categories.stream().map(CategoryConversor::toCategoryDto).collect(Collectors.toList());
    }
}
