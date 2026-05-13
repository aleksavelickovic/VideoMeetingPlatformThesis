package com.lilly.recorder.dto;

import java.util.ArrayList;
import java.util.List;

public class FilterList<T> {
    private List<T> items = new ArrayList<>();
    private int page;
    private int perPage;
    private long totalCount;

    public FilterList() {
    }

    public FilterList(List<T> items, long totalCount, int page, int perPage) {
        this.items = items;
        this.totalCount = totalCount;
        this.page = page;
        this.perPage = perPage;
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPerPage() {
        return perPage;
    }

    public void setPerPage(int perPage) {
        this.perPage = perPage;
    }

    public long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(long totalCount) {
        this.totalCount = totalCount;
    }

    public long getTotalPages() {
        return perPage == 0 ? 0 : (long) Math.ceil(totalCount / (double) perPage);
    }
}
