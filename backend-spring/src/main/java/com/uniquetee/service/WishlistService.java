package com.uniquetee.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uniquetee.entity.Wishlist;
import com.uniquetee.repository.WishlistRepository;

/**
 * Service quản lý Danh sách yêu thích
 */
@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    /**
     * Lấy danh sách yêu thích của người dùng
     */
    public List<Wishlist> getWishlistByUserId(Integer userId) {
        return wishlistRepository.findByUserId(userId);
    }

    /**
     * Kiểm tra sản phẩm có trong danh sách yêu thích hay không
     */
    public boolean isProductInWishlist(Integer userId, Integer productId) {
        return wishlistRepository.findByUserIdAndProductId(userId, productId).isPresent();
    }

    /**
     * Thêm sản phẩm vào danh sách yêu thích
     */
    public Wishlist addToWishlist(Wishlist wishlist) {
        return wishlistRepository.save(wishlist);
    }

    /**
     * Xoá sản phẩm khỏi danh sách yêu thích
     */
    public void removeFromWishlist(Integer userId, Integer productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    /**
     * Xoá toàn bộ danh sách yêu thích của người dùng
     */
    public void clearWishlist(Integer userId) {
        List<Wishlist> wishlists = wishlistRepository.findByUserId(userId);
        wishlistRepository.deleteAll(wishlists);
    }

    /**
     * Đếm số sản phẩm yêu thích
     */
    public Long countWishlistItems(Integer userId) {
        return wishlistRepository.countByUserId(userId);
    }

    /**
     * Lấy tất cả danh sách yêu thích
     */
    public List<Wishlist> getAllWishlists() {
        return wishlistRepository.findAll();
    }

    /**
     * Xoá wish list theo ID
     */
    public void deleteWishlistById(Integer id) {
        wishlistRepository.deleteById(id);
    }

    /**
     * Kiểm tra wish list có tồn tại không
     */
    public boolean wishlistExists(Integer id) {
        return wishlistRepository.existsById(id);
    }
}
