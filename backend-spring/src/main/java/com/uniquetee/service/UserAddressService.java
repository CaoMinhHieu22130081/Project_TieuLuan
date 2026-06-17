package com.uniquetee.service;

import com.uniquetee.entity.User;
import com.uniquetee.entity.UserAddress;
import com.uniquetee.repository.UserAddressRepository;
import com.uniquetee.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserAddressService {

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private UserRepository userRepository;

    public List<UserAddress> getAddresses(Integer userId) {
        return userAddressRepository.findByUserIdOrderByIsDefaultDescUpdatedAtDesc(userId);
    }

    public Optional<UserAddress> getDefaultAddress(Integer userId) {
        return userAddressRepository.findByUserIdAndIsDefaultTrue(userId);
    }

    @Transactional
    public UserAddress createAddress(Integer userId, UserAddress param) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isFirst = !userAddressRepository.existsByUserId(userId);
        
        param.setUser(user);
        
        if (isFirst || (param.getIsDefault() != null && param.getIsDefault())) {
            userAddressRepository.clearDefaultByUserId(userId);
            param.setIsDefault(true);
        } else {
            param.setIsDefault(false);
        }

        return userAddressRepository.save(param);
    }

    @Transactional
    public UserAddress updateAddress(Integer userId, Integer addressId, UserAddress param) {
        UserAddress existing = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or unauthorized"));

        existing.setReceiverName(param.getReceiverName());
        existing.setReceiverPhone(param.getReceiverPhone());
        existing.setProvinceId(param.getProvinceId());
        existing.setProvinceName(param.getProvinceName());
        existing.setDistrictId(param.getDistrictId());
        existing.setDistrictName(param.getDistrictName());
        existing.setWardCode(param.getWardCode());
        existing.setWardName(param.getWardName());
        existing.setDetailAddress(param.getDetailAddress());
        existing.setNote(param.getNote());

        if (param.getIsDefault() != null && param.getIsDefault() && !existing.getIsDefault()) {
            userAddressRepository.clearDefaultByUserId(userId);
            existing.setIsDefault(true);
        }

        return userAddressRepository.save(existing);
    }

    @Transactional
    public void deleteAddress(Integer userId, Integer addressId) {
        UserAddress existing = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or unauthorized"));

        boolean defaultsLost = existing.getIsDefault();
        userAddressRepository.delete(existing);
        userAddressRepository.flush();

        if (defaultsLost) {
            userAddressRepository.findFirstByUserIdOrderByUpdatedAtDesc(userId).ifPresent(fallback -> {
                fallback.setIsDefault(true);
                userAddressRepository.save(fallback);
            });
        }
    }

    @Transactional
    public UserAddress setDefaultAddress(Integer userId, Integer addressId) {
        UserAddress existing = userAddressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or unauthorized"));

        if (!existing.getIsDefault()) {
            userAddressRepository.clearDefaultByUserId(userId);
            existing.setIsDefault(true);
            existing = userAddressRepository.save(existing);
        }
        
        return existing;
    }
}
