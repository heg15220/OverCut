package com.overcut.f1hub.rest.dtos;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.sql.Date;
import java.time.LocalDate;

@Converter(autoApply = true)
public class LocalDateAttributeConverter implements AttributeConverter<LocalDate, Date> {

    @Override
    public Date convertToDatabaseColumn(LocalDate locDate) {
        return locDate != null ? Date.valueOf(locDate) : null;
    }

    @Override
    public LocalDate convertToEntityAttribute(Date sqlDate) {
        return sqlDate != null ? sqlDate.toLocalDate() : null;
    }
}

