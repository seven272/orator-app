import React, { useRef } from 'react'
import { FiUser } from 'react-icons/fi'
import styles from './ProfileForm.module.css'

const ProfileForm = ({
  firstName, setFirstName,
  lastName, setLastName,
  displayName, setDisplayName,
  email, setEmail,
  imgUrl,
  isProfileSaving,
  isLoading,
  hasSocialAvatar,
  isAvatarChanged,
  handleAvatarChange,
  handleResetAvatar,
  handleUpdateProfile
}) => {
  const avatarInputRef = useRef(null)

  return (
    <form onSubmit={handleUpdateProfile} className={styles.form_profile}>
      <h5 className={styles.sub_heading}>Личные данные</h5>
      
      {/* Секция инлайн-превью и изменения аватара через Multer */}
      <div className={styles.avatar_edit_section}>
        <div className={styles.preview_box}>
          <label className={styles.input_label_mini}>Превью аватара</label>
          {imgUrl ? <img 
            src={imgUrl || ''} 
            alt="Avatar Preview" 
            className={styles.avatar_preview_img} 
          /> : <FiUser size={35} className={styles.avatar_icon}/>}
          
        </div>
        <div className={styles.avatar_actions_box}>
          <input 
            type="file" 
            ref={avatarInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
            disabled={isProfileSaving}
          />
          <button 
            type="button"
            className={styles.upload_btn_inline} 
            onClick={() => avatarInputRef.current.click()}
            disabled={isProfileSaving}
          >
            Выбрать новый файл
          </button>
          
          {hasSocialAvatar && isAvatarChanged && (
            <button 
              type="button" 
              className={styles.reset_avatar_link} 
              onClick={handleResetAvatar} 
              disabled={isProfileSaving}
            >
              Вернуть из соцсети
            </button>
          )}
        </div>
      </div>

      <div className={styles.input_group}>
        <label>Никнейм</label>
        <input 
          type="text" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)} 
          placeholder="Ваш никнейм"
          disabled={isProfileSaving}
          required
        />
      </div>

      <div className={styles.input_group}>
        <label>Email (Почта)</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="example@mail.ru"
          disabled={isProfileSaving}
        />
      </div>

      <div className={styles.input_group}>
        <label>Имя</label>
        <input 
          type="text" 
          value={firstName} 
          onChange={(e) => setFirstName(e.target.value)} 
          placeholder="Имя"
          disabled={isProfileSaving}
        />
      </div>

      <div className={styles.input_group}>
        <label>Фамилия</label>
        <input 
          type="text" 
          value={lastName} 
          onChange={(e) => setLastName(e.target.value)} 
          placeholder="Фамилия"
          disabled={isProfileSaving}
        />
      </div>

      <button type="submit" className={styles.primary_btn} disabled={isProfileSaving || isLoading}>
        {isProfileSaving ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </form>
  )
}

export default ProfileForm
